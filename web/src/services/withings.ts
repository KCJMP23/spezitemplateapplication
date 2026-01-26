/**
 * INTELLIC Health - Withings API Integration Service
 *
 * Integrates with Withings Health Devices:
 * - Body+ Smart Scale (weight, BMI, body composition)
 * - BPM Connect Blood Pressure Monitor
 * - Sleep Analyzer
 * - Smart Baby Monitor
 *
 * API Documentation: https://developer.withings.com/api-reference/
 *
 * Setup Instructions:
 * 1. Register app at https://developer.withings.com/
 * 2. Get Client ID and Client Secret
 * 3. Set redirect URI (must match your app's callback URL)
 * 4. Add credentials to .env:
 *    VITE_WITHINGS_CLIENT_ID=your_client_id
 *    VITE_WITHINGS_CLIENT_SECRET=your_secret
 *    VITE_WITHINGS_REDIRECT_URI=https://your-app.com/withings/callback
 */

import { logger } from '@/utils/logger';
import { HealthData, HealthDataType } from '@/types';
import healthDataService from './healthData';
import fhirService from './fhir';
import { Browser } from '@capacitor/browser';

export interface WithingsConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiUrl: string;
}

export interface WithingsAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId: string;
}

export interface WithingsMeasurement {
  type: WithingsMeasureType;
  value: number;
  unit: number;
  timestamp: Date;
  category: number; // 1 = real measurement, 2 = user objective
  deviceId?: string;
}

export enum WithingsMeasureType {
  Weight = 1,
  Height = 4,
  FatFreeMass = 5,
  FatRatio = 6,
  FatMassWeight = 8,
  DiastolicBloodPressure = 9,
  SystolicBloodPressure = 10,
  HeartRate = 11,
  Temperature = 12,
  SpO2 = 54,
  BodyTemperature = 71,
  SkinTemperature = 73,
  MuscleMass = 76,
  Hydration = 77,
  BoneMass = 88,
  PulseWaveVelocity = 91,
}

class WithingsService {
  private config: WithingsConfig;
  private tokens: WithingsAuthTokens | null = null;
  private syncInterval: number | null = null;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_WITHINGS_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_WITHINGS_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_WITHINGS_REDIRECT_URI || 'http://localhost:5173/withings/callback',
      apiUrl: import.meta.env.VITE_WITHINGS_API_URL || 'https://wbsapi.withings.net',
    };
  }

  /**
   * Check if Withings integration is configured
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.tokens) return false;
    return new Date() < this.tokens.expiresAt;
  }

  /**
   * Start OAuth 2.0 authorization flow
   */
  async authorize(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        'Withings API not configured. Please set VITE_WITHINGS_CLIENT_ID and VITE_WITHINGS_CLIENT_SECRET in .env'
      );
    }

    try {
      // Generate random state for CSRF protection
      const state = this.generateRandomString(32);
      sessionStorage.setItem('withings_oauth_state', state);

      // Build authorization URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: 'user.metrics',
        state,
      });

      const authUrl = `https://account.withings.com/oauth2_user/authorize2?${params.toString()}`;

      logger.info('[Withings] Opening authorization URL');

      // Open in system browser (better for OAuth)
      await Browser.open({ url: authUrl });

      // Note: The callback will be handled by your app's deep link handler
      // You need to set up a route at /withings/callback to handle the response
    } catch (error) {
      logger.error('[Withings] Authorization error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      // Verify state parameter (CSRF protection)
      const savedState = sessionStorage.getItem('withings_oauth_state');
      if (state !== savedState) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      logger.info('[Withings] Exchanging authorization code for tokens');

      // Exchange code for tokens
      const response = await fetch(`${this.config.apiUrl}/v2/oauth2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'requesttoken',
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 0) {
        throw new Error(`Withings API error: ${data.error || 'Unknown error'}`);
      }

      // Store tokens
      this.tokens = {
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresAt: new Date(Date.now() + data.body.expires_in * 1000),
        userId: data.body.userid,
      };

      // Persist tokens (in production, use secure storage)
      localStorage.setItem('withings_tokens', JSON.stringify(this.tokens));

      logger.info('[Withings] Authentication successful');
      return true;
    } catch (error) {
      logger.error('[Withings] Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh expired access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      logger.info('[Withings] Refreshing access token');

      const response = await fetch(`${this.config.apiUrl}/v2/oauth2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'requesttoken',
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.tokens.refreshToken,
        }),
      });

      const data = await response.json();

      if (data.status !== 0) {
        throw new Error(`Token refresh failed: ${data.error}`);
      }

      // Update tokens
      this.tokens = {
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresAt: new Date(Date.now() + data.body.expires_in * 1000),
        userId: this.tokens.userId,
      };

      localStorage.setItem('withings_tokens', JSON.stringify(this.tokens));

      logger.info('[Withings] Token refreshed successfully');
    } catch (error) {
      logger.error('[Withings] Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get measurements from Withings API
   */
  async getMeasurements(startDate: Date, endDate: Date): Promise<WithingsMeasurement[]> {
    if (!this.isAuthenticated()) {
      await this.refreshAccessToken();
    }

    try {
      logger.info('[Withings] Fetching measurements');

      const params = new URLSearchParams({
        action: 'getmeas',
        access_token: this.tokens!.accessToken,
        startdate: Math.floor(startDate.getTime() / 1000).toString(),
        enddate: Math.floor(endDate.getTime() / 1000).toString(),
        category: '1', // Real measurements only
      });

      const response = await fetch(`${this.config.apiUrl}/measure?${params.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.status !== 0) {
        throw new Error(`Withings API error: ${data.error || 'Unknown error'}`);
      }

      // Parse measurements
      const measurements: WithingsMeasurement[] = [];

      for (const measureGroup of data.body.measuregrps || []) {
        const timestamp = new Date(measureGroup.date * 1000);
        const category = measureGroup.category;
        const deviceId = measureGroup.deviceid;

        for (const measure of measureGroup.measures) {
          // Convert value (Withings sends value * 10^unit)
          const value = measure.value * Math.pow(10, measure.unit);

          measurements.push({
            type: measure.type,
            value,
            unit: measure.unit,
            timestamp,
            category,
            deviceId,
          });
        }
      }

      logger.info(`[Withings] Retrieved ${measurements.length} measurements`);
      return measurements;
    } catch (error) {
      logger.error('[Withings] Error fetching measurements:', error);
      throw error;
    }
  }

  /**
   * Sync Withings measurements to our health data storage
   */
  async syncMeasurements(userId: string, startDate: Date, endDate: Date): Promise<void> {
    try {
      const measurements = await this.getMeasurements(startDate, endDate);

      logger.info(`[Withings] Syncing ${measurements.length} measurements`);

      for (const measurement of measurements) {
        const healthData = this.convertToHealthData(userId, measurement);
        if (healthData) {
          await healthDataService.saveHealthData(healthData);

          // Convert to FHIR Observation
          const fhirObservation = fhirService.healthDataToObservation(healthData);
          logger.debug('[Withings] Created FHIR Observation:', fhirObservation.id);
        }
      }

      logger.info('[Withings] Sync completed');
    } catch (error) {
      logger.error('[Withings] Sync error:', error);
      throw error;
    }
  }

  /**
   * Convert Withings measurement to our HealthData format
   */
  private convertToHealthData(
    userId: string,
    measurement: WithingsMeasurement
  ): HealthData | null {
    let type: HealthDataType;
    let unit: string;
    let value = measurement.value;

    switch (measurement.type) {
      case WithingsMeasureType.Weight:
        type = 'weight';
        unit = 'kg';
        break;

      case WithingsMeasureType.SystolicBloodPressure:
        type = 'blood_pressure';
        unit = 'mmHg';
        // Note: Systolic and diastolic come as separate measurements
        // In production, you'd want to pair them together
        break;

      case WithingsMeasureType.DiastolicBloodPressure:
        type = 'blood_pressure';
        unit = 'mmHg';
        break;

      case WithingsMeasureType.HeartRate:
        type = 'heart_rate';
        unit = 'bpm';
        break;

      case WithingsMeasureType.SpO2:
        type = 'oxygen_saturation';
        unit = '%';
        break;

      case WithingsMeasureType.Temperature:
      case WithingsMeasureType.BodyTemperature:
        type = 'temperature';
        unit = '°C';
        break;

      case WithingsMeasureType.Height:
        type = 'height';
        unit = 'm';
        break;

      default:
        // Unsupported measurement type
        logger.debug(`[Withings] Skipping unsupported measurement type: ${measurement.type}`);
        return null;
    }

    return {
      id: `withings_${measurement.type}_${measurement.timestamp.getTime()}`,
      userId,
      type,
      value,
      unit,
      recordedAt: measurement.timestamp,
      uploadedAt: new Date(),
      source: 'Withings',
      metadata: {
        category: measurement.category,
        deviceId: measurement.deviceId,
        measureType: measurement.type,
      },
    };
  }

  /**
   * Start automatic background sync
   */
  async startAutoSync(userId: string, intervalMinutes: number = 30): Promise<void> {
    logger.info(`[Withings] Starting auto-sync every ${intervalMinutes} minutes`);

    // Stop any existing sync
    this.stopAutoSync();

    const performSync = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - intervalMinutes * 60 * 1000);

        await this.syncMeasurements(userId, startDate, endDate);

        logger.info('[Withings] Auto-sync cycle completed');
      } catch (error) {
        logger.error('[Withings] Auto-sync error:', error);
      }
    };

    // Perform initial sync
    await performSync();

    // Schedule periodic sync
    this.syncInterval = window.setInterval(performSync, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('[Withings] Auto-sync stopped');
    }
  }

  /**
   * Disconnect Withings account
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('[Withings] Disconnecting account');

      this.stopAutoSync();
      this.tokens = null;
      localStorage.removeItem('withings_tokens');

      // Note: Withings doesn't have a token revocation endpoint
      // User must revoke access from their Withings account settings

      logger.info('[Withings] Account disconnected');
    } catch (error) {
      logger.error('[Withings] Disconnect error:', error);
      throw error;
    }
  }

  /**
   * Generate random string for OAuth state
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Load stored tokens
   */
  loadStoredTokens(): boolean {
    try {
      const stored = localStorage.getItem('withings_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        tokens.expiresAt = new Date(tokens.expiresAt);
        this.tokens = tokens;
        logger.info('[Withings] Loaded stored tokens');
        return true;
      }
    } catch (error) {
      logger.error('[Withings] Error loading tokens:', error);
    }
    return false;
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    authenticated: boolean;
    userId: string | null;
    autoSyncActive: boolean;
  } {
    return {
      configured: this.isConfigured(),
      authenticated: this.isAuthenticated(),
      userId: this.tokens?.userId || null,
      autoSyncActive: this.syncInterval !== null,
    };
  }
}

export const withingsService = new WithingsService();
export default withingsService;
