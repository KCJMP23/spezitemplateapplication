/**
 * INTELLIC Health - Epic MyChart / SMART on FHIR Integration
 *
 * Connects to Epic EHR systems to retrieve patient health records via FHIR R4.
 * Supports Epic MyChart and other Epic-based patient portals.
 *
 * SMART on FHIR Specification: http://hl7.org/fhir/smart-app-launch/
 * Epic FHIR Documentation: https://fhir.epic.com/
 *
 * ## Setup Instructions:
 *
 * ### 1. Register Your App with Epic
 * - Visit: https://fhir.epic.com/Developer/Apps
 * - Create a new app with these settings:
 *   - Application Audience: Patients
 *   - FHIR Specification: R4
 *   - Redirect URI: https://your-app.com/epic/callback
 *   - SMART on FHIR Version: v2.0
 *
 * ### 2. Request Production Access
 * - Complete Epic App Orchard application
 * - Provide app description and privacy policy
 * - Pass security review
 * - Sign BAA for HIPAA compliance
 *
 * ### 3. Configure Environment Variables
 * ```
 * VITE_EPIC_CLIENT_ID=your-client-id
 * VITE_EPIC_REDIRECT_URI=https://your-app.com/epic/callback
 * VITE_EPIC_FHIR_BASE_URL=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
 * ```
 *
 * ## Supported FHIR Resources:
 * - Patient (demographics)
 * - Observation (vitals, labs)
 * - Condition (diagnoses)
 * - MedicationRequest (prescriptions)
 * - AllergyIntolerance (allergies)
 * - Immunization (vaccines)
 * - DiagnosticReport (lab reports)
 * - DocumentReference (clinical documents)
 */

import { logger } from '@/utils/logger';
import { Browser } from '@capacitor/browser';
import type {
  FHIRPatient,
  FHIRObservation,
  FHIRCondition,
  FHIRMedicationRequest,
} from '@/types/fhir';

export interface EpicConfig {
  clientId: string;
  redirectUri: string;
  fhirBaseUrl: string;
  scope: string;
}

export interface EpicAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  patientId: string;
  scope: string;
  tokenType: string;
}

export interface SMARTMetadata {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  capabilities: string[];
}

class EpicMyChartService {
  private config: EpicConfig;
  private tokens: EpicAuthTokens | null = null;
  private metadata: SMARTMetadata | null = null;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_EPIC_CLIENT_ID || '',
      redirectUri: import.meta.env.VITE_EPIC_REDIRECT_URI || 'http://localhost:5173/epic/callback',
      fhirBaseUrl:
        import.meta.env.VITE_EPIC_FHIR_BASE_URL ||
        'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
      scope: 'patient/*.read launch/patient openid fhirUser',
    };
  }

  /**
   * Check if Epic integration is configured
   */
  isConfigured(): boolean {
    return !!this.config.clientId;
  }

  /**
   * Check if user is authenticated with Epic
   */
  isAuthenticated(): boolean {
    if (!this.tokens) return false;
    return new Date() < this.tokens.expiresAt;
  }

  /**
   * Discover SMART on FHIR endpoints from conformance statement
   */
  async discoverEndpoints(): Promise<SMARTMetadata> {
    try {
      logger.info('[Epic] Discovering SMART endpoints');

      const response = await fetch(`${this.config.fhirBaseUrl}/metadata`, {
        headers: {
          Accept: 'application/fhir+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const capability = await response.json();

      // Find OAuth2 extension
      const security = capability.rest?.[0]?.security;
      const oauth = security?.extension?.find(
        (ext: any) => ext.url === 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris'
      );

      if (!oauth) {
        throw new Error('SMART on FHIR endpoints not found in metadata');
      }

      this.metadata = {
        authorizationEndpoint: oauth.extension.find((e: any) => e.url === 'authorize')?.valueUri,
        tokenEndpoint: oauth.extension.find((e: any) => e.url === 'token')?.valueUri,
        capabilities: capability.rest?.[0]?.security?.service?.[0]?.coding?.[0]?.code || [],
      };

      logger.info('[Epic] Discovered endpoints:', this.metadata);
      return this.metadata;
    } catch (error) {
      logger.error('[Epic] Endpoint discovery error:', error);
      throw error;
    }
  }

  /**
   * Start SMART on FHIR authorization flow
   */
  async authorize(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        'Epic integration not configured. Please set VITE_EPIC_CLIENT_ID in .env'
      );
    }

    try {
      // Discover endpoints if not already done
      if (!this.metadata) {
        await this.discoverEndpoints();
      }

      // Generate PKCE code verifier and challenge (for public clients)
      const codeVerifier = this.generateRandomString(128);
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      // Store for later use in token exchange
      sessionStorage.setItem('epic_code_verifier', codeVerifier);

      // Generate state for CSRF protection
      const state = this.generateRandomString(32);
      sessionStorage.setItem('epic_oauth_state', state);

      // Build authorization URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: this.config.scope,
        state,
        aud: this.config.fhirBaseUrl,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `${this.metadata!.authorizationEndpoint}?${params.toString()}`;

      logger.info('[Epic] Opening authorization URL');

      // Open Epic MyChart login in system browser
      await Browser.open({ url: authUrl });

      // Note: The callback will be handled by your app's deep link handler
      // You need to set up a route at /epic/callback to handle the response
    } catch (error) {
      logger.error('[Epic] Authorization error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange authorization code for tokens
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      // Verify state parameter (CSRF protection)
      const savedState = sessionStorage.getItem('epic_oauth_state');
      if (state !== savedState) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      const codeVerifier = sessionStorage.getItem('epic_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      logger.info('[Epic] Exchanging authorization code for tokens');

      if (!this.metadata) {
        await this.discoverEndpoints();
      }

      // Exchange authorization code for access token
      const response = await fetch(this.metadata!.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
          client_id: this.config.clientId,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data = await response.json();

      // Decode patient ID from token (it's in the token response)
      const patientId = data.patient || this.extractPatientIdFromToken(data.access_token);

      // Store tokens
      this.tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        patientId,
        scope: data.scope,
        tokenType: data.token_type,
      };

      // Persist tokens (in production, use secure storage with encryption)
      localStorage.setItem('epic_tokens', JSON.stringify(this.tokens));

      // Clean up session storage
      sessionStorage.removeItem('epic_oauth_state');
      sessionStorage.removeItem('epic_code_verifier');

      logger.info('[Epic] Authentication successful, patient ID:', patientId);
      return true;
    } catch (error) {
      logger.error('[Epic] Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh expired access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available - user must re-authenticate');
    }

    try {
      logger.info('[Epic] Refreshing access token');

      if (!this.metadata) {
        await this.discoverEndpoints();
      }

      const response = await fetch(this.metadata!.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refreshToken,
          client_id: this.config.clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed - user must re-authenticate');
      }

      const data = await response.json();

      // Update tokens
      this.tokens = {
        ...this.tokens,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.tokens.refreshToken,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };

      localStorage.setItem('epic_tokens', JSON.stringify(this.tokens));

      logger.info('[Epic] Token refreshed successfully');
    } catch (error) {
      logger.error('[Epic] Token refresh error:', error);
      // Clear invalid tokens
      this.disconnect();
      throw new Error('Session expired - please log in again');
    }
  }

  /**
   * Fetch patient demographics
   */
  async getPatient(): Promise<FHIRPatient> {
    if (!this.isAuthenticated()) {
      await this.refreshAccessToken();
    }

    try {
      logger.info('[Epic] Fetching patient demographics');

      const response = await this.fhirRequest(`Patient/${this.tokens!.patientId}`);

      logger.info('[Epic] Retrieved patient data');
      return response as FHIRPatient;
    } catch (error) {
      logger.error('[Epic] Error fetching patient:', error);
      throw error;
    }
  }

  /**
   * Fetch patient observations (vitals, labs)
   */
  async getObservations(category?: string, count: number = 100): Promise<FHIRObservation[]> {
    if (!this.isAuthenticated()) {
      await this.refreshAccessToken();
    }

    try {
      logger.info('[Epic] Fetching observations');

      const params = new URLSearchParams({
        patient: this.tokens!.patientId,
        _count: count.toString(),
        _sort: '-date',
      });

      if (category) {
        params.append('category', category);
      }

      const response = await this.fhirRequest(`Observation?${params.toString()}`);

      const bundle = response as any;
      const observations = bundle.entry?.map((entry: any) => entry.resource) || [];

      logger.info(`[Epic] Retrieved ${observations.length} observations`);
      return observations;
    } catch (error) {
      logger.error('[Epic] Error fetching observations:', error);
      throw error;
    }
  }

  /**
   * Fetch patient conditions (diagnoses)
   */
  async getConditions(): Promise<FHIRCondition[]> {
    if (!this.isAuthenticated()) {
      await this.refreshAccessToken();
    }

    try {
      logger.info('[Epic] Fetching conditions');

      const params = new URLSearchParams({
        patient: this.tokens!.patientId,
        _count: '100',
      });

      const response = await this.fhirRequest(`Condition?${params.toString()}`);

      const bundle = response as any;
      const conditions = bundle.entry?.map((entry: any) => entry.resource) || [];

      logger.info(`[Epic] Retrieved ${conditions.length} conditions`);
      return conditions;
    } catch (error) {
      logger.error('[Epic] Error fetching conditions:', error);
      throw error;
    }
  }

  /**
   * Fetch patient medications
   */
  async getMedications(): Promise<FHIRMedicationRequest[]> {
    if (!this.isAuthenticated()) {
      await this.refreshAccessToken();
    }

    try {
      logger.info('[Epic] Fetching medications');

      const params = new URLSearchParams({
        patient: this.tokens!.patientId,
        _count: '100',
      });

      const response = await this.fhirRequest(`MedicationRequest?${params.toString()}`);

      const bundle = response as any;
      const medications = bundle.entry?.map((entry: any) => entry.resource) || [];

      logger.info(`[Epic] Retrieved ${medications.length} medications`);
      return medications;
    } catch (error) {
      logger.error('[Epic] Error fetching medications:', error);
      throw error;
    }
  }

  /**
   * Make authenticated FHIR API request
   */
  private async fhirRequest(path: string): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.config.fhirBaseUrl}/${path}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.tokens!.accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await this.refreshAccessToken();
        // Retry request with new token
        return this.fhirRequest(path);
      }

      throw new Error(`FHIR request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Disconnect Epic MyChart
   */
  disconnect(): void {
    logger.info('[Epic] Disconnecting account');

    this.tokens = null;
    localStorage.removeItem('epic_tokens');
    sessionStorage.removeItem('epic_oauth_state');
    sessionStorage.removeItem('epic_code_verifier');

    logger.info('[Epic] Account disconnected');
  }

  /**
   * Load stored tokens
   */
  loadStoredTokens(): boolean {
    try {
      const stored = localStorage.getItem('epic_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        tokens.expiresAt = new Date(tokens.expiresAt);
        this.tokens = tokens;
        logger.info('[Epic] Loaded stored tokens');
        return true;
      }
    } catch (error) {
      logger.error('[Epic] Error loading tokens:', error);
    }
    return false;
  }

  /**
   * Generate random string for PKCE and state
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);

    // Base64url encode
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Extract patient ID from JWT access token (fallback)
   */
  private extractPatientIdFromToken(token: string): string {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.patient || decoded.sub;
    } catch (error) {
      logger.error('[Epic] Error extracting patient ID from token:', error);
      throw new Error('Could not determine patient ID');
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    authenticated: boolean;
    patientId: string | null;
  } {
    return {
      configured: this.isConfigured(),
      authenticated: this.isAuthenticated(),
      patientId: this.tokens?.patientId || null,
    };
  }
}

export const epicMyChartService = new EpicMyChartService();
export default epicMyChartService;
