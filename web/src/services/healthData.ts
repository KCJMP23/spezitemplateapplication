import { HealthData, HealthDataType } from '@/types';
import { FHIRObservation } from '@/types/fhir';
import firebaseService from './firebase';
import fhirService from './fhir';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { generateUUID } from '@/utils/helpers';

class HealthDataService {
  // Save health data
  async saveHealthData(
    userId: string,
    type: HealthDataType,
    value: number,
    unit: string,
    recordedAt: Date = new Date(),
    sourceDevice?: string,
    sourceApp?: string
  ): Promise<HealthData> {
    try {
      const healthData: HealthData = {
        id: generateUUID(),
        userId,
        type,
        value,
        unit,
        sourceDevice,
        sourceApp,
        recordedAt,
        uploadedAt: new Date(),
      };

      // Convert to FHIR Observation
      const observation = fhirService.createObservation(healthData, userId);
      healthData.fhirResource = observation;

      // Save to Firestore
      await firebaseService.setDocument(
        `users/${userId}/healthData`,
        healthData.id,
        healthData
      );

      // Audit log
      await auditService.log(
        userId,
        'create',
        'health_data',
        healthData.id,
        {
          type,
          value,
          unit,
        }
      );

      logger.info('Health data saved', {
        userId,
        type,
        dataId: healthData.id,
      });

      return healthData;
    } catch (error) {
      logger.error('Failed to save health data', error);
      throw error;
    }
  }

  // Get user's health data
  async getUserHealthData(
    userId: string,
    type?: HealthDataType,
    startDate?: Date,
    endDate?: Date
  ): Promise<HealthData[]> {
    try {
      let data = await firebaseService.queryDocuments<HealthData>(
        `users/${userId}/healthData`
      );

      // Filter by type
      if (type) {
        data = data.filter((d) => d.type === type);
      }

      // Filter by date range
      if (startDate) {
        data = data.filter((d) => new Date(d.recordedAt) >= startDate);
      }
      if (endDate) {
        data = data.filter((d) => new Date(d.recordedAt) <= endDate);
      }

      // Sort by recorded date (newest first)
      data.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

      await auditService.logDataAccess(userId, 'health_data', type || 'all');

      return data;
    } catch (error) {
      logger.error('Failed to get user health data', error);
      return [];
    }
  }

  // Get aggregated statistics
  async getStatistics(
    userId: string,
    type: HealthDataType,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number | null;
  }> {
    try {
      const data = await this.getUserHealthData(userId, type, startDate, endDate);

      if (data.length === 0) {
        return {
          count: 0,
          average: 0,
          min: 0,
          max: 0,
          latest: null,
        };
      }

      const values = data.map((d) => d.value);
      const sum = values.reduce((acc, val) => acc + val, 0);

      return {
        count: data.length,
        average: sum / data.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: data[0].value,
      };
    } catch (error) {
      logger.error('Failed to calculate statistics', error);
      throw error;
    }
  }

  // Request permissions for health data (browser APIs)
  async requestPermissions(): Promise<boolean> {
    try {
      // Check if Generic Sensor API is available
      if ('Accelerometer' in window || 'LinearAccelerationSensor' in window) {
        logger.info('Generic Sensor API is available');
        return true;
      }

      // Check if Geolocation is available (for activity tracking)
      if ('geolocation' in navigator) {
        logger.info('Geolocation API is available');
        return true;
      }

      logger.warn('No health data APIs available');
      return false;
    } catch (error) {
      logger.error('Failed to request health data permissions', error);
      return false;
    }
  }

  // Collect step count (simulated - would integrate with actual pedometer API)
  async collectStepCount(userId: string): Promise<HealthData | null> {
    try {
      // In a real app, this would integrate with:
      // - Google Fit API (Android)
      // - Apple HealthKit (iOS via Capacitor)
      // - Samsung Health
      // - Fitbit API
      // - Garmin Connect

      // For demonstration, we'll create a simulated data point
      const simulatedSteps = Math.floor(Math.random() * 5000) + 3000;

      return await this.saveHealthData(
        userId,
        'steps',
        simulatedSteps,
        'count',
        new Date(),
        'Simulated Pedometer',
        'Spezi Health Web'
      );
    } catch (error) {
      logger.error('Failed to collect step count', error);
      return null;
    }
  }

  // Collect heart rate (simulated - would integrate with wearable APIs)
  async collectHeartRate(userId: string): Promise<HealthData | null> {
    try {
      // In a real app, this would integrate with wearable device APIs
      const simulatedHR = Math.floor(Math.random() * 30) + 60; // 60-90 bpm

      return await this.saveHealthData(
        userId,
        'heart_rate',
        simulatedHR,
        'beats/min',
        new Date(),
        'Simulated Heart Rate Monitor',
        'Spezi Health Web'
      );
    } catch (error) {
      logger.error('Failed to collect heart rate', error);
      return null;
    }
  }

  // Manual data entry
  async recordManualEntry(
    userId: string,
    type: HealthDataType,
    value: number,
    unit: string,
    recordedAt?: Date
  ): Promise<HealthData> {
    return await this.saveHealthData(
      userId,
      type,
      value,
      unit,
      recordedAt || new Date(),
      'Manual Entry',
      'Spezi Health Web'
    );
  }

  // Delete health data
  async deleteHealthData(userId: string, dataId: string): Promise<void> {
    try {
      await firebaseService.deleteDocument(`users/${userId}/healthData`, dataId);

      await auditService.log(
        userId,
        'delete',
        'health_data',
        dataId
      );

      logger.info('Health data deleted', { userId, dataId });
    } catch (error) {
      logger.error('Failed to delete health data', error);
      throw error;
    }
  }

  // Export health data as FHIR Bundle
  async exportAsFHIRBundle(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const data = await this.getUserHealthData(userId, undefined, startDate, endDate);

      const observations = data
        .filter((d) => d.fhirResource)
        .map((d) => d.fhirResource);

      const bundle = fhirService.createBundle(observations);

      await auditService.logDataExport(userId, 'health_data', {
        format: 'FHIR',
        recordCount: observations.length,
      });

      return bundle;
    } catch (error) {
      logger.error('Failed to export FHIR bundle', error);
      throw error;
    }
  }

  // Integration with Capacitor plugins for native apps
  async initializeNativeIntegrations(): Promise<void> {
    // This would be called when running as a native app via Capacitor
    try {
      // Check if running in Capacitor
      const { Capacitor } = await import('@capacitor/core');

      if (Capacitor.isNativePlatform()) {
        logger.info('Running on native platform:', Capacitor.getPlatform());

        // Initialize platform-specific health data integrations
        if (Capacitor.getPlatform() === 'ios') {
          // Initialize HealthKit integration
          logger.info('iOS HealthKit integration would be initialized here');
        } else if (Capacitor.getPlatform() === 'android') {
          // Initialize Google Fit / Health Connect integration
          logger.info('Android Health Connect integration would be initialized here');
        }
      } else {
        logger.info('Running on web platform');
      }
    } catch (error) {
      logger.debug('Capacitor not available, running in web mode');
    }
  }
}

export const healthDataService = new HealthDataService();
export default healthDataService;
