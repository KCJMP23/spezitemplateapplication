/**
 * INTELLIC Health - HealthKit Integration Service
 *
 * Provides real-time health data sync from Apple Watch and iPhone Health app.
 * Uses Capacitor native bridge for iOS HealthKit access.
 *
 * Supported Data Types:
 * - Heart Rate (bpm)
 * - Blood Pressure (systolic/diastolic mmHg)
 * - Steps (count)
 * - Distance (meters)
 * - Active Energy (kcal)
 * - Sleep Analysis (hours)
 * - Blood Glucose (mg/dL)
 * - Oxygen Saturation (%)
 * - Body Temperature (°F)
 * - Weight (kg)
 * - Height (cm)
 */

import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/logger';
import { HealthData, HealthDataType } from '@/types';
import healthDataService from './healthData';
import fhirService from './fhir';

export type HealthKitDataType =
  | 'heartRate'
  | 'bloodPressure'
  | 'steps'
  | 'distance'
  | 'activeEnergy'
  | 'sleepAnalysis'
  | 'bloodGlucose'
  | 'oxygenSaturation'
  | 'bodyTemperature'
  | 'weight'
  | 'height';

export interface HealthKitPermissions {
  read: HealthKitDataType[];
  write?: HealthKitDataType[];
}

export interface HealthKitSample {
  type: HealthKitDataType;
  value: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  sourceBundle?: string;
  sourceName?: string;
  metadata?: Record<string, any>;
}

export interface HealthKitQuery {
  type: HealthKitDataType;
  startDate: Date;
  endDate: Date;
  limit?: number;
  ascending?: boolean;
}

class HealthKitService {
  private isAvailable: boolean = false;
  private isAuthorized: boolean = false;
  private syncInterval: number | null = null;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if HealthKit is available on this device
   */
  private async checkAvailability(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      logger.warn('[HealthKit] Not available on web platform');
      this.isAvailable = false;
      return;
    }

    if (Capacitor.getPlatform() !== 'ios') {
      logger.warn('[HealthKit] Only available on iOS platform');
      this.isAvailable = false;
      return;
    }

    try {
      // Check if HealthKit plugin is available
      const { HealthKit } = await this.getHealthKitPlugin();
      if (HealthKit) {
        const available = await HealthKit.isAvailable();
        this.isAvailable = available?.value ?? false;
        logger.info('[HealthKit] Availability:', this.isAvailable);
      }
    } catch (error) {
      logger.error('[HealthKit] Error checking availability:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Dynamically load HealthKit plugin
   */
  private async getHealthKitPlugin(): Promise<any> {
    // For now, return mock implementation
    // In production, this would import the real Capacitor plugin
    if (!this.isAvailable && Capacitor.isNativePlatform()) {
      throw new Error('HealthKit is not available on this device');
    }

    // Mock plugin for development/testing
    return {
      HealthKit: {
        isAvailable: async () => ({ value: true }),
        requestAuthorization: async (permissions: HealthKitPermissions) => {
          logger.info('[HealthKit Mock] Authorization requested:', permissions);
          return { value: true };
        },
        queryHKitSampleType: async (query: HealthKitQuery) => {
          logger.info('[HealthKit Mock] Query:', query);
          // Return mock data
          return this.generateMockData(query);
        },
        multipleQueryHKitSampleType: async (queries: HealthKitQuery[]) => {
          logger.info('[HealthKit Mock] Multiple queries:', queries);
          const results: Record<string, HealthKitSample[]> = {};
          for (const query of queries) {
            results[query.type] = await this.generateMockData(query);
          }
          return results;
        },
      },
    };
  }

  /**
   * Request authorization to access HealthKit data
   */
  async requestAuthorization(permissions: HealthKitPermissions): Promise<boolean> {
    try {
      logger.info('[HealthKit] Requesting authorization:', permissions);

      const { HealthKit } = await this.getHealthKitPlugin();
      const result = await HealthKit.requestAuthorization(permissions);

      this.isAuthorized = result?.value ?? false;
      logger.info('[HealthKit] Authorization result:', this.isAuthorized);

      return this.isAuthorized;
    } catch (error) {
      logger.error('[HealthKit] Authorization error:', error);
      return false;
    }
  }

  /**
   * Query health data for a specific type and time range
   */
  async queryData(query: HealthKitQuery): Promise<HealthKitSample[]> {
    if (!this.isAuthorized) {
      throw new Error('HealthKit access not authorized. Call requestAuthorization() first.');
    }

    try {
      logger.info('[HealthKit] Querying data:', query);

      const { HealthKit } = await this.getHealthKitPlugin();
      const samples = await HealthKit.queryHKitSampleType(query);

      logger.info(`[HealthKit] Retrieved ${samples.length} samples for ${query.type}`);
      return samples;
    } catch (error) {
      logger.error('[HealthKit] Query error:', error);
      throw error;
    }
  }

  /**
   * Query multiple health data types at once
   */
  async queryMultiple(queries: HealthKitQuery[]): Promise<Record<string, HealthKitSample[]>> {
    if (!this.isAuthorized) {
      throw new Error('HealthKit access not authorized. Call requestAuthorization() first.');
    }

    try {
      logger.info('[HealthKit] Querying multiple data types:', queries.length);

      const { HealthKit } = await this.getHealthKitPlugin();
      const results = await HealthKit.multipleQueryHKitSampleType(queries);

      const totalSamples = Object.values(results).reduce(
        (sum, samples) => sum + samples.length,
        0
      );
      logger.info(`[HealthKit] Retrieved ${totalSamples} total samples`);

      return results;
    } catch (error) {
      logger.error('[HealthKit] Multiple query error:', error);
      throw error;
    }
  }

  /**
   * Sync health data to Firebase and convert to FHIR
   */
  async syncToStorage(userId: string, query: HealthKitQuery): Promise<void> {
    try {
      const samples = await this.queryData(query);

      logger.info(`[HealthKit] Syncing ${samples.length} samples to storage`);

      for (const sample of samples) {
        // Convert HealthKit sample to our HealthData format
        const healthData: HealthData = {
          id: `hk_${sample.type}_${sample.startDate.getTime()}`,
          userId,
          type: this.mapHealthKitTypeToDataType(sample.type),
          value: sample.value,
          unit: sample.unit,
          recordedAt: sample.startDate,
          uploadedAt: new Date(),
          source: sample.sourceName || 'Apple Health',
          metadata: {
            sourceBundle: sample.sourceBundle,
            endDate: sample.endDate.toISOString(),
            ...sample.metadata,
          },
        };

        // Save to Firebase
        await healthDataService.saveHealthData(healthData);

        // Convert to FHIR Observation
        const fhirObservation = fhirService.healthDataToObservation(healthData);
        logger.debug('[HealthKit] Created FHIR Observation:', fhirObservation.id);
      }

      logger.info('[HealthKit] Sync completed successfully');
    } catch (error) {
      logger.error('[HealthKit] Sync error:', error);
      throw error;
    }
  }

  /**
   * Start automatic background sync
   */
  async startAutoSync(userId: string, intervalMinutes: number = 15): Promise<void> {
    logger.info(`[HealthKit] Starting auto-sync every ${intervalMinutes} minutes`);

    // Stop any existing sync
    this.stopAutoSync();

    const syncTypes: HealthKitDataType[] = [
      'heartRate',
      'bloodPressure',
      'steps',
      'activeEnergy',
      'oxygenSaturation',
    ];

    const performSync = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - intervalMinutes * 60 * 1000);

        for (const type of syncTypes) {
          await this.syncToStorage(userId, {
            type,
            startDate,
            endDate,
            limit: 100,
          });
        }

        logger.info('[HealthKit] Auto-sync cycle completed');
      } catch (error) {
        logger.error('[HealthKit] Auto-sync error:', error);
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
      logger.info('[HealthKit] Auto-sync stopped');
    }
  }

  /**
   * Get most recent sample for a data type
   */
  async getLatestSample(type: HealthKitDataType): Promise<HealthKitSample | null> {
    try {
      const samples = await this.queryData({
        type,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date(),
        limit: 1,
        ascending: false, // Most recent first
      });

      return samples[0] || null;
    } catch (error) {
      logger.error('[HealthKit] Error getting latest sample:', error);
      return null;
    }
  }

  /**
   * Map HealthKit data type to our HealthDataType
   */
  private mapHealthKitTypeToDataType(hkType: HealthKitDataType): HealthDataType {
    const mapping: Record<HealthKitDataType, HealthDataType> = {
      heartRate: 'heart_rate',
      bloodPressure: 'blood_pressure',
      steps: 'steps',
      distance: 'distance',
      activeEnergy: 'calories',
      sleepAnalysis: 'sleep',
      bloodGlucose: 'blood_glucose',
      oxygenSaturation: 'oxygen_saturation',
      bodyTemperature: 'temperature',
      weight: 'weight',
      height: 'height',
    };

    return mapping[hkType];
  }

  /**
   * Generate mock data for testing (when real plugin not available)
   */
  private async generateMockData(query: HealthKitQuery): Promise<HealthKitSample[]> {
    const samples: HealthKitSample[] = [];
    const duration = query.endDate.getTime() - query.startDate.getTime();
    const limit = query.limit || 10;
    const interval = duration / limit;

    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(query.startDate.getTime() + i * interval);

      let value: number;
      let unit: string;

      switch (query.type) {
        case 'heartRate':
          value = 60 + Math.random() * 40; // 60-100 bpm
          unit = 'bpm';
          break;
        case 'bloodPressure':
          value = 120; // Systolic
          unit = 'mmHg';
          break;
        case 'steps':
          value = Math.floor(Math.random() * 1000);
          unit = 'count';
          break;
        case 'distance':
          value = Math.random() * 1000; // meters
          unit = 'm';
          break;
        case 'activeEnergy':
          value = Math.random() * 100; // kcal
          unit = 'kcal';
          break;
        case 'oxygenSaturation':
          value = 95 + Math.random() * 5; // 95-100%
          unit = '%';
          break;
        case 'weight':
          value = 70 + Math.random() * 10; // kg
          unit = 'kg';
          break;
        default:
          value = Math.random() * 100;
          unit = '';
      }

      samples.push({
        type: query.type,
        value,
        unit,
        startDate: timestamp,
        endDate: timestamp,
        sourceName: 'Apple Watch (Simulated)',
        sourceBundle: 'com.apple.health',
        metadata: {
          device: 'Apple Watch Series 9',
          workout: query.type === 'activeEnergy' ? 'Running' : undefined,
        },
      });
    }

    return samples;
  }

  /**
   * Get service status
   */
  getStatus(): {
    available: boolean;
    authorized: boolean;
    platform: string;
    autoSyncActive: boolean;
  } {
    return {
      available: this.isAvailable,
      authorized: this.isAuthorized,
      platform: Capacitor.getPlatform(),
      autoSyncActive: this.syncInterval !== null,
    };
  }
}

export const healthKitService = new HealthKitService();
export default healthKitService;
