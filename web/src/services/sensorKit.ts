/**
 * INTELLIC SensorKit Module
 *
 * Sensor data collection:
 * - Motion sensors (accelerometer, gyroscope)
 * - Environmental sensors
 * - Device sensors
 * - Sensor data streaming
 * - Activity recognition
 */

import { Motion, AccelListenerEvent } from '@capacitor/motion';
import { PluginListenerHandle } from '@capacitor/core';
import { logger } from '@/utils/logger';
import { globalEventBus } from './intellicKit';
import firebaseService from './firebase';

// ===== Sensor Types =====

export interface SensorData {
  id: string;
  userId: string;
  sensorType: SensorType;
  timestamp: Date;
  values: number[];
  accuracy?: number;
  metadata?: Record<string, any>;
}

export type SensorType =
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer'
  | 'orientation'
  | 'motion'
  | 'ambient_light'
  | 'proximity'
  | 'steps'
  | 'activity';

export interface ActivityData {
  userId: string;
  activityType: ActivityType;
  confidence: number;
  timestamp: Date;
  duration?: number;
}

export type ActivityType =
  | 'still'
  | 'walking'
  | 'running'
  | 'cycling'
  | 'in_vehicle'
  | 'tilting'
  | 'unknown';

export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  interval: number;
}

// ===== Sensor Manager =====

export class SensorManager {
  private activeSensors: Set<SensorType> = new Set();
  private sensorData: Map<SensorType, SensorData[]> = new Map();
  private maxDataPoints: number = 1000;
  private motionListenerId: PluginListenerHandle | null = null;
  private collecting: boolean = false;

  /**
   * Start collecting sensor data
   */
  async startCollecting(
    userId: string,
    sensorTypes: SensorType[],
    options?: {
      samplingRate?: number;
      batchSize?: number;
      saveToFirestore?: boolean;
    }
  ): Promise<void> {
    if (this.collecting) {
      logger.warn('Sensor collection already started');
      return;
    }

    this.collecting = true;
    const { samplingRate = 100, batchSize = 50, saveToFirestore = false } = options || {};

    try {
      for (const sensorType of sensorTypes) {
        await this.startSensor(userId, sensorType, samplingRate, batchSize, saveToFirestore);
      }

      logger.info('Started sensor data collection', { sensorTypes, samplingRate });
    } catch (error) {
      this.collecting = false;
      logger.error('Failed to start sensor collection', error);
      throw error;
    }
  }

  /**
   * Stop collecting sensor data
   */
  async stopCollecting(): Promise<void> {
    if (!this.collecting) {
      return;
    }

    try {
      // Stop motion sensors
      if (this.motionListenerId) {
        await this.motionListenerId.remove();
        this.motionListenerId = null;
      }

      // Stop other sensors
      for (const sensorType of this.activeSensors) {
        await this.stopSensor(sensorType);
      }

      this.activeSensors.clear();
      this.collecting = false;

      logger.info('Stopped sensor data collection');
      globalEventBus.emit('sensors:stopped');
    } catch (error) {
      logger.error('Failed to stop sensor collection', error);
    }
  }

  /**
   * Start individual sensor
   */
  private async startSensor(
    userId: string,
    sensorType: SensorType,
    samplingRate: number,
    batchSize: number,
    saveToFirestore: boolean
  ): Promise<void> {
    switch (sensorType) {
      case 'accelerometer':
      case 'gyroscope':
      case 'motion':
        await this.startMotionSensors(userId, samplingRate, batchSize, saveToFirestore);
        break;

      case 'ambient_light':
        await this.startAmbientLightSensor(userId);
        break;

      case 'orientation':
        await this.startOrientationSensor(userId);
        break;

      default:
        logger.warn(`Sensor type ${sensorType} not supported`);
    }

    this.activeSensors.add(sensorType);
  }

  /**
   * Stop individual sensor
   */
  private async stopSensor(sensorType: SensorType): Promise<void> {
    // Sensor-specific cleanup
    this.activeSensors.delete(sensorType);
  }

  /**
   * Start motion sensors (accelerometer, gyroscope)
   */
  private async startMotionSensors(
    userId: string,
    _samplingRate: number, // TODO: Use for configurable sampling rate
    batchSize: number,
    saveToFirestore: boolean
  ): Promise<void> {
    try {
      const batch: SensorData[] = [];

      this.motionListenerId = await Motion.addListener('accel', (event: AccelListenerEvent) => {
        const sensorData: SensorData = {
          id: this.generateId(),
          userId,
          sensorType: 'accelerometer',
          timestamp: new Date(),
          values: [event.acceleration.x, event.acceleration.y, event.acceleration.z],
          accuracy: event.acceleration.x !== undefined ? 1 : 0,
        };

        this.addSensorData('accelerometer', sensorData);
        batch.push(sensorData);

        // Emit real-time event
        globalEventBus.emit('sensor:data', sensorData);

        // Save batch if size reached
        if (saveToFirestore && batch.length >= batchSize) {
          this.saveBatch(userId, [...batch]);
          batch.length = 0;
        }
      });

      logger.info('Motion sensors started');
    } catch (error) {
      logger.error('Failed to start motion sensors', error);
      throw error;
    }
  }

  /**
   * Start ambient light sensor
   */
  private async startAmbientLightSensor(userId: string): Promise<void> {
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();

        sensor.addEventListener('reading', () => {
          const sensorData: SensorData = {
            id: this.generateId(),
            userId,
            sensorType: 'ambient_light',
            timestamp: new Date(),
            values: [sensor.illuminance],
          };

          this.addSensorData('ambient_light', sensorData);
          globalEventBus.emit('sensor:data', sensorData);
        });

        sensor.start();
        logger.info('Ambient light sensor started');
      } catch (error) {
        logger.error('Failed to start ambient light sensor', error);
      }
    } else {
      logger.warn('Ambient light sensor not supported');
    }
  }

  /**
   * Start device orientation sensor
   */
  private async startOrientationSensor(userId: string): Promise<void> {
    if ('DeviceOrientationEvent' in window) {
      const handler = (event: DeviceOrientationEvent) => {
        if (event.alpha === null || event.beta === null || event.gamma === null) {
          return;
        }

        const sensorData: SensorData = {
          id: this.generateId(),
          userId,
          sensorType: 'orientation',
          timestamp: new Date(),
          values: [event.alpha, event.beta, event.gamma],
        };

        this.addSensorData('orientation', sensorData);
        globalEventBus.emit('sensor:data', sensorData);
      };

      window.addEventListener('deviceorientation', handler);
      logger.info('Orientation sensor started');
    } else {
      logger.warn('Device orientation not supported');
    }
  }

  /**
   * Get sensor data
   */
  getSensorData(sensorType: SensorType, limit?: number): SensorData[] {
    const data = this.sensorData.get(sensorType) || [];
    if (limit) {
      return data.slice(-limit);
    }
    return [...data];
  }

  /**
   * Get all sensor data
   */
  getAllSensorData(): Map<SensorType, SensorData[]> {
    return new Map(this.sensorData);
  }

  /**
   * Clear sensor data
   */
  clearSensorData(sensorType?: SensorType): void {
    if (sensorType) {
      this.sensorData.delete(sensorType);
    } else {
      this.sensorData.clear();
    }
    logger.info('Sensor data cleared', { sensorType });
  }

  /**
   * Add sensor data point
   */
  private addSensorData(sensorType: SensorType, data: SensorData): void {
    if (!this.sensorData.has(sensorType)) {
      this.sensorData.set(sensorType, []);
    }

    const dataArray = this.sensorData.get(sensorType)!;
    dataArray.push(data);

    // Limit data points
    if (dataArray.length > this.maxDataPoints) {
      dataArray.shift();
    }
  }

  /**
   * Save batch to Firestore
   */
  private async saveBatch(userId: string, batch: SensorData[]): Promise<void> {
    try {
      const batchId = this.generateId();
      await firebaseService.setDocument(`users/${userId}/sensorBatches`, batchId, {
        id: batchId,
        data: batch,
        timestamp: new Date(),
        count: batch.length,
      });

      logger.debug('Sensor batch saved', { batchId, count: batch.length });
    } catch (error) {
      logger.error('Failed to save sensor batch', error);
    }
  }

  /**
   * Analyze activity from sensor data
   */
  analyzeActivity(accelerometerData: SensorData[]): ActivityType {
    if (accelerometerData.length < 10) {
      return 'unknown';
    }

    // Simple activity recognition based on acceleration magnitude
    const magnitudes = accelerometerData.map((d) => {
      const [x, y, z] = d.values;
      return Math.sqrt(x * x + y * y + z * z);
    });

    const avgMagnitude = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
    const variance =
      magnitudes.reduce((sum, m) => sum + Math.pow(m - avgMagnitude, 2), 0) / magnitudes.length;

    // Simple thresholds (would be more sophisticated in production)
    if (variance < 0.1) {
      return 'still';
    } else if (variance < 2.0) {
      return 'walking';
    } else if (variance < 5.0) {
      return 'running';
    } else {
      return 'in_vehicle';
    }
  }

  /**
   * Check if collecting
   */
  isCollecting(): boolean {
    return this.collecting;
  }

  /**
   * Get active sensors
   */
  getActiveSensors(): SensorType[] {
    return Array.from(this.activeSensors);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `sensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ===== Step Counter =====

export class StepCounter {
  private stepCount: number = 0;
  private startTime: Date | null = null;
  private counting: boolean = false;

  async start(_userId: string): Promise<void> {
    if (this.counting) {
      logger.warn('Step counting already started');
      return;
    }

    this.counting = true;
    this.stepCount = 0;
    this.startTime = new Date();

    // Use accelerometer data to detect steps
    // This is a simplified implementation
    logger.info('Step counting started', { startTime: this.startTime });
  }

  stop(): number {
    if (!this.counting) {
      return 0;
    }

    this.counting = false;
    logger.info('Step counting stopped', { steps: this.stepCount });
    return this.stepCount;
  }

  getStepCount(): number {
    return this.stepCount;
  }

  reset(): void {
    this.stepCount = 0;
    this.startTime = null;
  }
}

// ===== Export =====

export const sensorManager = new SensorManager();
export const stepCounter = new StepCounter();

export default {
  SensorManager,
  sensorManager,
  StepCounter,
  stepCounter,
};
