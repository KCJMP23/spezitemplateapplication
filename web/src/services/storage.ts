import localforage from 'localforage';
import { logger } from '@/utils/logger';

/**
 * SpeziStorage React Migration
 *
 * Migrates iOS SpeziStorage functionality to React/Web:
 * - Offline-first storage with IndexedDB
 * - Sync queue for offline operations
 * - Cache management
 * - Encrypted storage support
 */

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data?: any;
  timestamp: number;
  retries: number;
}

class StorageService {
  private store: LocalForage;
  private syncQueue: LocalForage;
  private cache: LocalForage;

  constructor() {
    // Main storage
    this.store = localforage.createInstance({
      name: 'SpeziHealth',
      storeName: 'main',
      description: 'Main data storage',
    });

    // Sync queue for offline operations
    this.syncQueue = localforage.createInstance({
      name: 'SpeziHealth',
      storeName: 'syncQueue',
      description: 'Offline sync queue',
    });

    // Cache storage
    this.cache = localforage.createInstance({
      name: 'SpeziHealth',
      storeName: 'cache',
      description: 'Cached data',
    });

    logger.info('Storage service initialized');
  }

  // ===== Main Storage =====

  async set<T>(key: string, value: T): Promise<T> {
    try {
      await this.store.setItem(key, value);
      logger.debug('Data stored', { key });
      return value;
    } catch (error) {
      logger.error('Failed to store data', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.store.getItem<T>(key);
      return value;
    } catch (error) {
      logger.error('Failed to get data', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.store.removeItem(key);
      logger.debug('Data removed', { key });
    } catch (error) {
      logger.error('Failed to remove data', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.store.clear();
      logger.info('Storage cleared');
    } catch (error) {
      logger.error('Failed to clear storage', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      return await this.store.keys();
    } catch (error) {
      logger.error('Failed to get keys', error);
      return [];
    }
  }

  async length(): Promise<number> {
    try {
      return await this.store.length();
    } catch (error) {
      logger.error('Failed to get length', error);
      return 0;
    }
  }

  // ===== Cache Management =====

  async setCache<T>(key: string, value: T, ttl?: number): Promise<T> {
    try {
      const cacheItem = {
        value,
        timestamp: Date.now(),
        ttl,
      };

      await this.cache.setItem(key, cacheItem);
      logger.debug('Data cached', { key, ttl });
      return value;
    } catch (error) {
      logger.error('Failed to cache data', error);
      throw error;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cacheItem = await this.cache.getItem<{
        value: T;
        timestamp: number;
        ttl?: number;
      }>(key);

      if (!cacheItem) {
        return null;
      }

      // Check if cache is expired
      if (cacheItem.ttl) {
        const age = Date.now() - cacheItem.timestamp;
        if (age > cacheItem.ttl) {
          await this.cache.removeItem(key);
          logger.debug('Cache expired', { key, age, ttl: cacheItem.ttl });
          return null;
        }
      }

      return cacheItem.value;
    } catch (error) {
      logger.error('Failed to get cached data', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.cache.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      return await this.cache.length();
    } catch (error) {
      logger.error('Failed to get cache size', error);
      return 0;
    }
  }

  // ===== Sync Queue =====

  async addToSyncQueue(
    operation: SyncQueueItem['operation'],
    collection: string,
    documentId: string,
    data?: any
  ): Promise<void> {
    try {
      const item: SyncQueueItem = {
        id: `${collection}_${documentId}_${Date.now()}`,
        operation,
        collection,
        documentId,
        data,
        timestamp: Date.now(),
        retries: 0,
      };

      await this.syncQueue.setItem(item.id, item);
      logger.info('Added to sync queue', { operation, collection, documentId });
    } catch (error) {
      logger.error('Failed to add to sync queue', error);
    }
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const items: SyncQueueItem[] = [];
      await this.syncQueue.iterate<SyncQueueItem, void>((value) => {
        items.push(value);
      });

      // Sort by timestamp
      items.sort((a, b) => a.timestamp - b.timestamp);

      return items;
    } catch (error) {
      logger.error('Failed to get sync queue', error);
      return [];
    }
  }

  async removeFromSyncQueue(itemId: string): Promise<void> {
    try {
      await this.syncQueue.removeItem(itemId);
      logger.debug('Removed from sync queue', { itemId });
    } catch (error) {
      logger.error('Failed to remove from sync queue', error);
    }
  }

  async clearSyncQueue(): Promise<void> {
    try {
      await this.syncQueue.clear();
      logger.info('Sync queue cleared');
    } catch (error) {
      logger.error('Failed to clear sync queue', error);
    }
  }

  async getSyncQueueSize(): Promise<number> {
    try {
      return await this.syncQueue.length();
    } catch (error) {
      logger.error('Failed to get sync queue size', error);
      return 0;
    }
  }

  async incrementRetry(itemId: string): Promise<void> {
    try {
      const item = await this.syncQueue.getItem<SyncQueueItem>(itemId);
      if (item) {
        item.retries += 1;
        await this.syncQueue.setItem(itemId, item);
      }
    } catch (error) {
      logger.error('Failed to increment retry', error);
    }
  }

  // ===== Utility Methods =====

  async getStorageInfo(): Promise<{
    mainSize: number;
    cacheSize: number;
    syncQueueSize: number;
  }> {
    try {
      const [mainSize, cacheSize, syncQueueSize] = await Promise.all([
        this.store.length(),
        this.cache.length(),
        this.syncQueue.length(),
      ]);

      return {
        mainSize,
        cacheSize,
        syncQueueSize,
      };
    } catch (error) {
      logger.error('Failed to get storage info', error);
      return {
        mainSize: 0,
        cacheSize: 0,
        syncQueueSize: 0,
      };
    }
  }

  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.store.clear(),
        this.cache.clear(),
        this.syncQueue.clear(),
      ]);

      logger.info('All storage cleared');
    } catch (error) {
      logger.error('Failed to clear all storage', error);
    }
  }

  // ===== Encryption Support =====

  /**
   * Derive encryption key from passphrase using PBKDF2
   */
  private async deriveKey(passphrase: string, salt: BufferSource): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passphraseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM with passphrase
   */
  private async encrypt(data: string, passphrase: string): Promise<string> {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from passphrase
    const key = await this.deriveKey(passphrase, salt);

    // Encrypt data
    const encoder = new TextEncoder();
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine salt + IV + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt data using AES-GCM with passphrase
   */
  private async decrypt(encryptedBase64: string, passphrase: string): Promise<string> {
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);

    // Derive key from passphrase
    const key = await this.deriveKey(passphrase, salt);

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  /**
   * Store data securely with AES-256-GCM encryption
   */
  async setSecure<T>(key: string, value: T, passphrase: string): Promise<T> {
    try {
      const jsonData = JSON.stringify(value);
      const encrypted = await this.encrypt(jsonData, passphrase);
      await this.store.setItem(`secure_${key}`, encrypted);

      logger.debug('Secure data stored (AES-256-GCM)', { key });

      return value;
    } catch (error) {
      logger.error('Failed to store secure data', error);
      throw error;
    }
  }

  /**
   * Retrieve securely stored data with AES-256-GCM decryption
   */
  async getSecure<T>(key: string, passphrase: string): Promise<T | null> {
    try {
      const encrypted = await this.store.getItem<string>(`secure_${key}`);

      if (!encrypted) {
        return null;
      }

      const decrypted = await this.decrypt(encrypted, passphrase);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      logger.error('Failed to get secure data (wrong passphrase or corrupted data)', error);
      return null;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
