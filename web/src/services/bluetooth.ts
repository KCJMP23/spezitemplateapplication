/**
 * INTELLIC Bluetooth Module
 *
 * Bluetooth device connectivity:
 * - Web Bluetooth API integration
 * - Device pairing and connection
 * - GATT services and characteristics
 * - Health device protocols (BLE HDP, Continua)
 * - Data streaming from BLE devices
 */

import { logger } from '@/utils/logger';
import { globalEventBus } from './speziKit';
import { deviceManager, ConnectedDevice, DeviceType } from './devices';

// ===== Bluetooth Types =====

export interface BluetoothDeviceFilter {
  name?: string;
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
  manufacturerId?: number;
}

export interface BluetoothCharacteristic {
  uuid: string;
  properties: {
    read: boolean;
    write: boolean;
    notify: boolean;
  };
  value?: DataView;
}

export interface BluetoothService {
  uuid: string;
  isPrimary: boolean;
  characteristics: Map<string, BluetoothCharacteristic>;
}

export interface HealthDeviceData {
  deviceId: string;
  timestamp: Date;
  dataType: 'heart_rate' | 'blood_pressure' | 'glucose' | 'weight' | 'temperature' | 'spo2';
  value: number | { systolic: number; diastolic: number };
  unit: string;
}

// Standard Bluetooth GATT UUIDs for health devices
export const GATT_SERVICES = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  BLOOD_PRESSURE: '00001810-0000-1000-8000-00805f9b34fb',
  GLUCOSE: '00001808-0000-1000-8000-00805f9b34fb',
  HEALTH_THERMOMETER: '00001809-0000-1000-8000-00805f9b34fb',
  WEIGHT_SCALE: '0000181d-0000-1000-8000-00805f9b34fb',
  PULSE_OXIMETER: '00001822-0000-1000-8000-00805f9b34fb',
  DEVICE_INFORMATION: '0000180a-0000-1000-8000-00805f9b34fb',
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
};

export const GATT_CHARACTERISTICS = {
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  BLOOD_PRESSURE_MEASUREMENT: '00002a35-0000-1000-8000-00805f9b34fb',
  GLUCOSE_MEASUREMENT: '00002a18-0000-1000-8000-00805f9b34fb',
  TEMPERATURE_MEASUREMENT: '00002a1c-0000-1000-8000-00805f9b34fb',
  WEIGHT_MEASUREMENT: '00002a9d-0000-1000-8000-00805f9b34fb',
  SPO2_MEASUREMENT: '00002a5f-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  MANUFACTURER_NAME: '00002a29-0000-1000-8000-00805f9b34fb',
  MODEL_NUMBER: '00002a24-0000-1000-8000-00805f9b34fb',
  FIRMWARE_REVISION: '00002a26-0000-1000-8000-00805f9b34fb',
};

// ===== Bluetooth Manager =====

export class BluetoothManager {
  private connectedDevices: Map<string, BluetoothDevice> = new Map();
  private gattServers: Map<string, BluetoothRemoteGATTServer> = new Map();
  private characteristics: Map<string, Map<string, BluetoothRemoteGATTCharacteristic>> = new Map();

  /**
   * Check if Web Bluetooth is available
   */
  isAvailable(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * Request Bluetooth device
   */
  async requestDevice(filters?: BluetoothDeviceFilter[]): Promise<BluetoothDevice> {
    if (!this.isAvailable()) {
      throw new Error('Web Bluetooth is not available');
    }

    try {
      const options: RequestDeviceOptions = {
        filters: filters || [{ services: [GATT_SERVICES.HEART_RATE] }],
        optionalServices: Object.values(GATT_SERVICES),
      };

      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in this browser');
      }

      const device = await navigator.bluetooth.requestDevice(options);

      logger.info('Bluetooth device requested', {
        name: device.name,
        id: device.id,
      });

      // Note: gattserverdisconnected event handling would be set up after connection
      // The standard Web Bluetooth API doesn't support addEventListener on BluetoothDevice directly

      return device;
    } catch (error) {
      logger.error('Failed to request Bluetooth device', error);
      throw error;
    }
  }

  /**
   * Connect to Bluetooth device
   */
  async connect(device: BluetoothDevice): Promise<void> {
    try {
      logger.info('Connecting to Bluetooth device', {
        name: device.name,
        id: device.id,
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to get GATT server');
      }

      this.connectedDevices.set(device.id, device);
      this.gattServers.set(device.id, server);

      // Register with device manager
      const connectedDevice: ConnectedDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        type: this.detectDeviceType(server),
        connectionStatus: 'connected',
        lastSeen: new Date(),
        capabilities: ['bluetooth'],
      };

      deviceManager.registerDevice(connectedDevice);

      // Discover services
      await this.discoverServices(device.id, server);

      globalEventBus.emit('bluetooth:connected', { deviceId: device.id });

      logger.info('Successfully connected to Bluetooth device');
    } catch (error) {
      logger.error('Failed to connect to Bluetooth device', error);
      throw error;
    }
  }

  /**
   * Disconnect from Bluetooth device
   */
  async disconnect(deviceId: string): Promise<void> {
    const server = this.gattServers.get(deviceId);
    if (server) {
      server.disconnect();
      this.handleDisconnect(deviceId);
    }
  }

  private handleDisconnect(deviceId: string): void {
    logger.info('Bluetooth device disconnected', { deviceId });

    this.connectedDevices.delete(deviceId);
    this.gattServers.delete(deviceId);
    this.characteristics.delete(deviceId);

    deviceManager.unregisterDevice(deviceId);
    globalEventBus.emit('bluetooth:disconnected', { deviceId });
  }

  /**
   * Discover GATT services
   */
  private async discoverServices(
    deviceId: string,
    server: BluetoothRemoteGATTServer
  ): Promise<void> {
    try {
      const characteristics = new Map<string, BluetoothRemoteGATTCharacteristic>();

      // Web Bluetooth API requires requesting services one at a time
      // Try each known GATT service
      for (const serviceUUID of Object.values(GATT_SERVICES)) {
        try {
          const service = await server.getPrimaryService(serviceUUID);
          logger.debug('Discovered service', { uuid: service.uuid });

          const chars = await service.getCharacteristics();
          for (const char of chars) {
            characteristics.set(char.uuid, char);

            // Subscribe to notifications if supported
            if (char.properties.notify) {
              await this.subscribeToNotifications(deviceId, char);
            }
          }
        } catch (error) {
          // Service not available on this device, continue
          logger.debug('Service not available', { serviceUUID });
        }
      }

      this.characteristics.set(deviceId, characteristics);
    } catch (error) {
      logger.error('Failed to discover services', error);
    }
  }

  /**
   * Subscribe to characteristic notifications
   */
  private async subscribeToNotifications(
    deviceId: string,
    characteristic: BluetoothRemoteGATTCharacteristic
  ): Promise<void> {
    try {
      await characteristic.startNotifications();

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const char = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        this.handleCharacteristicChange(deviceId, char);
      });

      logger.debug('Subscribed to characteristic notifications', {
        uuid: characteristic.uuid,
      });
    } catch (error) {
      logger.error('Failed to subscribe to notifications', error);
    }
  }

  /**
   * Handle characteristic value change
   */
  private handleCharacteristicChange(
    deviceId: string,
    characteristic: BluetoothRemoteGATTCharacteristic
  ): void {
    const value = characteristic.value;
    if (!value) return;

    // Parse based on characteristic UUID
    const healthData = this.parseHealthData(deviceId, characteristic.uuid, value);
    if (healthData) {
      globalEventBus.emit('bluetooth:data', healthData);
    }
  }

  /**
   * Parse health data from characteristic value
   */
  private parseHealthData(
    deviceId: string,
    characteristicUUID: string,
    value: DataView
  ): HealthDeviceData | null {
    try {
      switch (characteristicUUID) {
        case GATT_CHARACTERISTICS.HEART_RATE_MEASUREMENT:
          return {
            deviceId,
            timestamp: new Date(),
            dataType: 'heart_rate',
            value: value.getUint8(1),
            unit: 'bpm',
          };

        case GATT_CHARACTERISTICS.BLOOD_PRESSURE_MEASUREMENT:
          return {
            deviceId,
            timestamp: new Date(),
            dataType: 'blood_pressure',
            value: {
              systolic: value.getUint16(1, true),
              diastolic: value.getUint16(3, true),
            },
            unit: 'mmHg',
          };

        case GATT_CHARACTERISTICS.TEMPERATURE_MEASUREMENT:
          // Temperature is in 10^-2 degrees Celsius
          const temp = value.getUint32(1, true) / 100;
          return {
            deviceId,
            timestamp: new Date(),
            dataType: 'temperature',
            value: temp,
            unit: '°C',
          };

        case GATT_CHARACTERISTICS.WEIGHT_MEASUREMENT:
          // Weight in kg with resolution 0.005
          const weight = value.getUint16(1, true) * 0.005;
          return {
            deviceId,
            timestamp: new Date(),
            dataType: 'weight',
            value: weight,
            unit: 'kg',
          };

        case GATT_CHARACTERISTICS.SPO2_MEASUREMENT:
          return {
            deviceId,
            timestamp: new Date(),
            dataType: 'spo2',
            value: value.getUint16(1, true) / 10,
            unit: '%',
          };

        default:
          logger.debug('Unknown characteristic', { uuid: characteristicUUID });
          return null;
      }
    } catch (error) {
      logger.error('Failed to parse health data', error);
      return null;
    }
  }

  /**
   * Read characteristic value
   */
  async readCharacteristic(deviceId: string, characteristicUUID: string): Promise<DataView | null> {
    try {
      const characteristics = this.characteristics.get(deviceId);
      const characteristic = characteristics?.get(characteristicUUID);

      if (!characteristic) {
        throw new Error(`Characteristic ${characteristicUUID} not found`);
      }

      const value = await characteristic.readValue();
      return value;
    } catch (error) {
      logger.error('Failed to read characteristic', error);
      return null;
    }
  }

  /**
   * Write characteristic value
   */
  async writeCharacteristic(
    deviceId: string,
    characteristicUUID: string,
    value: BufferSource
  ): Promise<void> {
    try {
      const characteristics = this.characteristics.get(deviceId);
      const characteristic = characteristics?.get(characteristicUUID);

      if (!characteristic) {
        throw new Error(`Characteristic ${characteristicUUID} not found`);
      }

      await characteristic.writeValue(value);
      logger.debug('Wrote characteristic value', { uuid: characteristicUUID });
    } catch (error) {
      logger.error('Failed to write characteristic', error);
      throw error;
    }
  }

  /**
   * Read battery level
   */
  async readBatteryLevel(deviceId: string): Promise<number | null> {
    const value = await this.readCharacteristic(deviceId, GATT_CHARACTERISTICS.BATTERY_LEVEL);
    return value ? value.getUint8(0) : null;
  }

  /**
   * Detect device type from GATT services
   */
  private detectDeviceType(_server: BluetoothRemoteGATTServer): DeviceType {
    // This would check available services to determine device type
    // Simplified version:
    return 'other';
  }

  /**
   * Get connected devices
   */
  getConnectedDevices(): BluetoothDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Check if device is connected
   */
  isConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }
}

// ===== Export =====

export const bluetoothManager = new BluetoothManager();

export default {
  BluetoothManager,
  bluetoothManager,
  GATT_SERVICES,
  GATT_CHARACTERISTICS,
};
