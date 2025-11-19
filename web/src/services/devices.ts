/**
 * SpeziDevices React Migration
 *
 * Device integration and management:
 * - Connected device tracking
 * - Device capabilities detection
 * - Platform-specific features
 * - Device health monitoring
 * - Battery and connection status
 *
 * ## Device Discovery - Partial Implementation
 *
 * The `startScan()` method currently uses a simulated device discovery process.
 * For production use with actual Bluetooth/USB devices, implement device-specific
 * discovery using Web Bluetooth API or Capacitor plugins:
 *
 * **Bluetooth Devices** (Blood pressure monitors, glucometers, etc.):
 * ```typescript
 * const device = await navigator.bluetooth.requestDevice({
 *   filters: [{ services: ['heart_rate'] }]
 * });
 * ```
 *
 * **USB Devices** (Medical equipment):
 * ```typescript
 * const device = await navigator.usb.requestDevice({
 *   filters: [{ vendorId: 0x1234 }]
 * });
 * ```
 *
 * **Capacitor Bluetooth Plugin** (For native apps):
 * ```typescript
 * import { BleClient } from '@capacitor-community/bluetooth-le';
 * await BleClient.requestDevice({
 *   services: ['heart_rate']
 * });
 * ```
 */

import { Capacitor } from '@capacitor/core';
import { Device, DeviceInfo } from '@capacitor/device';
import { logger } from '@/utils/logger';
import { globalEventBus } from './speziKit';

// ===== Device Types =====

export interface ConnectedDevice {
  id: string;
  name: string;
  type: DeviceType;
  manufacturer?: string;
  model?: string;
  firmwareVersion?: string;
  batteryLevel?: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastSeen: Date;
  capabilities: string[];
}

export type DeviceType = 'phone' | 'tablet' | 'watch' | 'fitness_tracker' | 'blood_pressure' | 'glucose_meter' | 'scale' | 'thermometer' | 'pulse_oximeter' | 'ecg' | 'other';

export interface DeviceCapabilities {
  platform: 'web' | 'ios' | 'android';
  isNative: boolean;
  hasCamera: boolean;
  hasLocation: boolean;
  hasBluetooth: boolean;
  hasNFC: boolean;
  hasBiometrics: boolean;
  hasNotifications: boolean;
  hasHealthKit: boolean;
  hasGoogleFit: boolean;
}

// ===== Device Manager =====

export class DeviceManager {
  private devices: Map<string, ConnectedDevice> = new Map();
  private currentDevice: DeviceInfo | null = null;
  private capabilities: DeviceCapabilities | null = null;

  async initialize(): Promise<void> {
    try {
      // Get current device info
      this.currentDevice = await Device.getInfo();
      logger.info('Device initialized', this.currentDevice);

      // Detect capabilities
      this.capabilities = await this.detectCapabilities();
      logger.info('Device capabilities detected', this.capabilities);

      // Set up battery monitoring
      await this.setupBatteryMonitoring();
    } catch (error) {
      logger.error('Failed to initialize device manager', error);
    }
  }

  private async detectCapabilities(): Promise<DeviceCapabilities> {
    const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
    const isNative = Capacitor.isNativePlatform();

    return {
      platform,
      isNative,
      hasCamera: await this.checkCapability('camera'),
      hasLocation: await this.checkCapability('geolocation'),
      hasBluetooth: await this.checkCapability('bluetooth'),
      hasNFC: await this.checkCapability('nfc'),
      hasBiometrics: isNative,
      hasNotifications: 'Notification' in window || isNative,
      hasHealthKit: platform === 'ios' && isNative,
      hasGoogleFit: platform === 'android' && isNative,
    };
  }

  private async checkCapability(capability: string): Promise<boolean> {
    switch (capability) {
      case 'camera':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      case 'geolocation':
        return 'geolocation' in navigator;
      case 'bluetooth':
        return 'bluetooth' in navigator;
      case 'nfc':
        return 'NDEFReader' in window;
      default:
        return false;
    }
  }

  private async setupBatteryMonitoring(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();

        battery.addEventListener('levelchange', () => {
          globalEventBus.emit('device:battery:change', {
            level: battery.level,
            charging: battery.charging,
          });
        });

        battery.addEventListener('chargingchange', () => {
          globalEventBus.emit('device:battery:charging', battery.charging);
        });
      } catch (error) {
        logger.debug('Battery API not available', error);
      }
    }
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.currentDevice;
  }

  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  getPlatform(): 'web' | 'ios' | 'android' {
    return this.capabilities?.platform || 'web';
  }

  isNative(): boolean {
    return this.capabilities?.isNative || false;
  }

  hasCapability(capability: keyof DeviceCapabilities): boolean {
    const value = this.capabilities?.[capability];
    return typeof value === 'boolean' ? value : false;
  }

  // Connected devices management
  registerDevice(device: ConnectedDevice): void {
    this.devices.set(device.id, device);
    globalEventBus.emit('device:connected', device);
    logger.info('Device registered', { id: device.id, name: device.name });
  }

  unregisterDevice(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      globalEventBus.emit('device:disconnected', device);
      logger.info('Device unregistered', { id: deviceId });
    }
  }

  updateDevice(deviceId: string, updates: Partial<ConnectedDevice>): void {
    const device = this.devices.get(deviceId);
    if (device) {
      const updated = { ...device, ...updates };
      this.devices.set(deviceId, updated);
      globalEventBus.emit('device:updated', updated);
    }
  }

  getDevice(deviceId: string): ConnectedDevice | undefined {
    return this.devices.get(deviceId);
  }

  getAllDevices(): ConnectedDevice[] {
    return Array.from(this.devices.values());
  }

  getDevicesByType(type: DeviceType): ConnectedDevice[] {
    return this.getAllDevices().filter((d) => d.type === type);
  }

  getConnectedDevices(): ConnectedDevice[] {
    return this.getAllDevices().filter((d) => d.connectionStatus === 'connected');
  }
}

// ===== Device Discovery =====

export class DeviceDiscovery {
  private scanning: boolean = false;
  private discoveredDevices: Map<string, ConnectedDevice> = new Map();

  async startScan(deviceTypes?: DeviceType[]): Promise<void> {
    if (this.scanning) {
      logger.warn('Device scan already in progress');
      return;
    }

    this.scanning = true;
    this.discoveredDevices.clear();

    logger.info('Starting device scan', { deviceTypes });
    globalEventBus.emit('device:scan:start');

    // ⚠️ SIMULATED IMPLEMENTATION - Replace with real device discovery
    //
    // For production, implement device type-specific scanning:
    //
    // if (deviceTypes.includes('bluetooth')) {
    //   await this.scanBluetoothDevices();
    // }
    // if (deviceTypes.includes('usb')) {
    //   await this.scanUSBDevices();
    // }
    //
    // Example Bluetooth scan:
    // try {
    //   const device = await navigator.bluetooth.requestDevice({
    //     acceptAllDevices: true,
    //     optionalServices: ['battery_service', 'device_information']
    //   });
    //   this.handleDeviceDiscovered(device);
    // } catch (error) {
    //   logger.error('Bluetooth scan failed', error);
    // }

    logger.warn('Device scanning is simulated. Implement real device discovery for production.');

    // Simulated scan timeout
    setTimeout(() => {
      this.stopScan();
    }, 5000);
  }

  stopScan(): void {
    if (!this.scanning) {
      return;
    }

    this.scanning = false;
    logger.info('Stopped device scan');
    globalEventBus.emit('device:scan:stop', {
      devicesFound: this.discoveredDevices.size,
    });
  }

  isScanning(): boolean {
    return this.scanning;
  }

  getDiscoveredDevices(): ConnectedDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  onDeviceDiscovered(callback: (device: ConnectedDevice) => void): () => void {
    return globalEventBus.on('device:discovered', callback);
  }
}

// ===== Device Health Monitor =====

export class DeviceHealthMonitor {
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private monitoring: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  registerHealthCheck(deviceId: string, check: () => Promise<boolean>): void {
    this.healthChecks.set(deviceId, check);
  }

  unregisterHealthCheck(deviceId: string): void {
    this.healthChecks.delete(deviceId);
  }

  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.checkInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, intervalMs);

    logger.info('Started device health monitoring');
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.monitoring = false;
    logger.info('Stopped device health monitoring');
  }

  private async performHealthChecks(): Promise<void> {
    for (const [deviceId, check] of this.healthChecks) {
      try {
        const healthy = await check();
        if (!healthy) {
          globalEventBus.emit('device:health:warning', {
            deviceId,
            status: 'unhealthy',
          });
        }
      } catch (error) {
        logger.error('Device health check failed', { deviceId, error });
        globalEventBus.emit('device:health:error', {
          deviceId,
          error,
        });
      }
    }
  }
}

// ===== Export =====

export const deviceManager = new DeviceManager();
export const deviceDiscovery = new DeviceDiscovery();
export const deviceHealthMonitor = new DeviceHealthMonitor();

export default {
  DeviceManager,
  deviceManager,
  DeviceDiscovery,
  deviceDiscovery,
  DeviceHealthMonitor,
  deviceHealthMonitor,
};
