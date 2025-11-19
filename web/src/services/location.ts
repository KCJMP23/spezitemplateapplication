/**
 * INTELLIC Location Module
 *
 * Location services:
 * - Geolocation API
 * - Position tracking
 * - Geofencing
 * - Location history
 * - Privacy-aware location handling
 */

import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { limit } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { globalEventBus } from './speziKit';
import firebaseService from './firebase';

// ===== Location Types =====

export interface LocationData {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  context?: string;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  active: boolean;
}

export interface GeofenceEvent {
  geofenceId: string;
  eventType: 'enter' | 'exit';
  timestamp: Date;
  position: LocationData;
}

// ===== Location Manager =====

export class LocationManager {
  private watchId: string | null = null;
  private currentPosition: Position | null = null;
  private locationHistory: LocationData[] = [];
  private maxHistorySize: number = 100;
  private geofences: Map<string, Geofence> = new Map();
  private tracking: boolean = false;

  /**
   * Check location permissions
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const result = await Geolocation.checkPermissions();
      const status = result.location;
      // Handle Android's 'prompt-with-rationale' as 'prompt'
      return status === 'prompt-with-rationale' ? 'prompt' : status;
    } catch (error) {
      logger.error('Failed to check location permissions', error);
      return 'denied';
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<'granted' | 'denied'> {
    try {
      const result = await Geolocation.requestPermissions();
      logger.info('Location permissions requested', { status: result.location });
      return result.location === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      logger.error('Failed to request location permissions', error);
      return 'denied';
    }
  }

  /**
   * Get current position
   */
  async getCurrentPosition(userId?: string): Promise<LocationData> {
    try {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      const position = await Geolocation.getCurrentPosition(options);
      this.currentPosition = position;

      const locationData = this.convertToLocationData(position, userId);

      // Audit log
      if (userId) {
        await auditService.log(userId, 'read', 'health_data', 'current', {
          type: 'location',
          accuracy: locationData.accuracy,
        });
      }

      globalEventBus.emit('location:updated', locationData);

      return locationData;
    } catch (error) {
      logger.error('Failed to get current position', error);
      throw error;
    }
  }

  /**
   * Start tracking location
   */
  async startTracking(
    userId: string,
    options?: {
      interval?: number;
      highAccuracy?: boolean;
      saveToHistory?: boolean;
    }
  ): Promise<void> {
    if (this.tracking) {
      logger.warn('Location tracking already started');
      return;
    }

    const {
      interval = 60000, // 1 minute
      highAccuracy = true,
      saveToHistory = true,
    } = options || {};

    try {
      this.tracking = true;

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 0,
        },
        (position, err) => {
          if (err) {
            logger.error('Location watch error', err);
            return;
          }

          if (position) {
            const locationData = this.convertToLocationData(position, userId);

            if (saveToHistory) {
              this.addToHistory(locationData);
            }

            // Check geofences
            this.checkGeofences(locationData);

            globalEventBus.emit('location:tracked', locationData);
          }
        }
      );

      logger.info('Started location tracking', { userId, interval });

      // Audit log
      await auditService.log(userId, 'create', 'health_data', 'tracking', {
        type: 'location_tracking',
        interval,
        highAccuracy,
      });
    } catch (error) {
      this.tracking = false;
      logger.error('Failed to start location tracking', error);
      throw error;
    }
  }

  /**
   * Stop tracking location
   */
  async stopTracking(userId?: string): Promise<void> {
    if (!this.tracking || !this.watchId) {
      return;
    }

    try {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      this.tracking = false;

      logger.info('Stopped location tracking');

      if (userId) {
        await auditService.log(userId, 'update', 'health_data', 'tracking', {
          type: 'location_tracking',
          action: 'stopped',
        });
      }

      globalEventBus.emit('location:tracking:stopped');
    } catch (error) {
      logger.error('Failed to stop location tracking', error);
    }
  }

  /**
   * Get location history
   */
  getHistory(limit?: number): LocationData[] {
    if (limit) {
      return this.locationHistory.slice(-limit);
    }
    return [...this.locationHistory];
  }

  /**
   * Clear location history
   */
  clearHistory(): void {
    this.locationHistory = [];
    logger.info('Location history cleared');
  }

  /**
   * Save location to Firestore
   */
  async saveLocation(location: LocationData): Promise<void> {
    try {
      await firebaseService.setDocument(
        `users/${location.userId}/locations`,
        location.id,
        location
      );

      logger.debug('Location saved to Firestore', { id: location.id });
    } catch (error) {
      logger.error('Failed to save location', error);
    }
  }

  /**
   * Get saved locations from Firestore
   */
  async getSavedLocations(userId: string, maxResults: number = 50): Promise<LocationData[]> {
    try {
      const locations = await firebaseService.queryDocuments<LocationData>(
        `users/${userId}/locations`,
        limit(maxResults)
      );

      await auditService.logDataAccess(userId, 'health_data', 'location_history');

      return locations;
    } catch (error) {
      logger.error('Failed to get saved locations', error);
      return [];
    }
  }

  // ===== Geofencing =====

  /**
   * Add geofence
   */
  addGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
    logger.info('Geofence added', { id: geofence.id, name: geofence.name });
  }

  /**
   * Remove geofence
   */
  removeGeofence(geofenceId: string): void {
    this.geofences.delete(geofenceId);
    logger.info('Geofence removed', { id: geofenceId });
  }

  /**
   * Get all geofences
   */
  getGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Check if position is within geofences
   */
  private checkGeofences(location: LocationData): void {
    for (const geofence of this.geofences.values()) {
      if (!geofence.active) continue;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.latitude,
        geofence.longitude
      );

      const wasInside = this.isInsideGeofence(location, geofence);
      const isInside = distance <= geofence.radius;

      if (!wasInside && isInside) {
        // Entered geofence
        const event: GeofenceEvent = {
          geofenceId: geofence.id,
          eventType: 'enter',
          timestamp: new Date(),
          position: location,
        };
        globalEventBus.emit('geofence:enter', event);
      } else if (wasInside && !isInside) {
        // Exited geofence
        const event: GeofenceEvent = {
          geofenceId: geofence.id,
          eventType: 'exit',
          timestamp: new Date(),
          position: location,
        };
        globalEventBus.emit('geofence:exit', event);
      }
    }
  }

  /**
   * Check if location is inside geofence
   */
  private isInsideGeofence(location: LocationData, geofence: Geofence): boolean {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.latitude,
      geofence.longitude
    );
    return distance <= geofence.radius;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // ===== Private Helpers =====

  private convertToLocationData(position: Position, userId?: string): LocationData {
    return {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || 'unknown',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: new Date(position.timestamp),
    };
  }

  private addToHistory(location: LocationData): void {
    this.locationHistory.push(location);

    // Limit history size
    if (this.locationHistory.length > this.maxHistorySize) {
      this.locationHistory.shift();
    }
  }

  /**
   * Get current position (cached)
   */
  getCachedPosition(): LocationData | null {
    if (this.currentPosition) {
      return this.convertToLocationData(this.currentPosition);
    }
    return null;
  }

  /**
   * Check if tracking
   */
  isTracking(): boolean {
    return this.tracking;
  }
}

// ===== Export =====

export const locationManager = new LocationManager();

export default {
  LocationManager,
  locationManager,
};
