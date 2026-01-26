/**
 * INTELLIC Networking Module
 *
 * Networking and API utilities:
 * - HTTP client with interceptors
 * - Request/response handling
 * - Error handling and retry logic
 * - Authentication headers
 * - Request queuing
 * - Network status monitoring
 */

import { logger } from '@/utils/logger';
import { AsyncUtils } from '@/utils/foundation';
import storageService from './storage';

// ===== Network Types =====

export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  timeout?: number;
  retry?: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: 'fixed' | 'exponential';
  };
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  onSuccess?: (response: any) => any | Promise<any>;
  onError?: (error: Error) => any | Promise<any>;
}

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// ===== HTTP Client =====

export class HTTPClient {
  private baseURL: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  constructor(baseURL?: string) {
    if (baseURL) {
      this.baseURL = baseURL;
    }
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  async request<T = any>(config: RequestConfig): Promise<T> {
    try {
      // Apply request interceptors
      let finalConfig = config;
      for (const interceptor of this.requestInterceptors) {
        finalConfig = await interceptor(finalConfig);
      }

      // Build URL
      const url = this.buildURL(finalConfig.url, finalConfig.params);

      // Build headers
      const headers = {
        ...this.defaultHeaders,
        ...finalConfig.headers,
      };

      // Check cache if enabled
      if (finalConfig.cache?.enabled && finalConfig.method === 'GET') {
        const cached = await this.getCachedResponse<T>(url);
        if (cached) {
          logger.debug('Returning cached response', { url });
          return cached;
        }
      }

      // Make request with retry logic
      const response = await this.executeRequest<T>(
        url,
        {
          method: finalConfig.method || 'GET',
          headers,
          body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
        },
        finalConfig.retry,
        finalConfig.timeout
      );

      // Cache response if enabled
      if (finalConfig.cache?.enabled && finalConfig.method === 'GET') {
        await this.cacheResponse(url, response, finalConfig.cache.ttl);
      }

      // Apply success response interceptors
      let finalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onSuccess) {
          finalResponse = await interceptor.onSuccess(finalResponse);
        }
      }

      return finalResponse;
    } catch (error) {
      // Apply error response interceptors
      let finalError = error;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onError) {
          finalError = await interceptor.onError(finalError as Error);
        }
      }

      throw finalError;
    }
  }

  private async executeRequest<T>(
    url: string,
    init: RequestInit,
    retryConfig?: RequestConfig['retry'],
    timeout?: number
  ): Promise<T> {
    const executeOnce = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = timeout
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }

        return (await response.text()) as any;
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new NetworkError('Request timeout', 408);
        }

        throw error;
      }
    };

    if (retryConfig) {
      return AsyncUtils.retry(executeOnce, {
        maxRetries: retryConfig.maxRetries,
        delayMs: retryConfig.delayMs,
        backoff: retryConfig.backoff,
        onRetry: (error, attempt) => {
          logger.warn(`Request failed, retrying (${attempt})`, {
            url,
            error: error.message,
          });
        },
      });
    }

    return executeOnce();
  }

  private buildURL(path: string, params?: Record<string, string>): string {
    let url = path.startsWith('http') ? path : `${this.baseURL}${path}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  private async getCachedResponse<T>(url: string): Promise<T | null> {
    try {
      return await storageService.getCache<T>(`network:${url}`);
    } catch (error) {
      logger.debug('Cache read error', error);
      return null;
    }
  }

  private async cacheResponse<T>(url: string, data: T, ttl?: number): Promise<void> {
    try {
      await storageService.setCache(`network:${url}`, data, ttl);
    } catch (error) {
      logger.debug('Cache write error', error);
    }
  }

  // Convenience methods
  async get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'POST', body });
  }

  async put<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PUT', body });
  }

  async patch<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PATCH', body });
  }

  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  // Queue management for offline support
  async enqueueRequest(requestFn: () => Promise<any>): Promise<void> {
    this.requestQueue.push(requestFn);
    logger.info('Request queued for later execution', {
      queueLength: this.requestQueue.length,
    });
  }

  async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    logger.info('Processing queued requests', {
      count: this.requestQueue.length,
    });

    while (this.requestQueue.length > 0) {
      const requestFn = this.requestQueue.shift();
      if (requestFn) {
        try {
          await requestFn();
        } catch (error) {
          logger.error('Queued request failed', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }

  clearQueue(): void {
    this.requestQueue = [];
  }
}

// ===== Network Error =====

export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// ===== Network Monitor =====

export class NetworkMonitor {
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private currentStatus: NetworkStatus = {
    online: navigator.onLine,
  };

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));

    // Check network information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', () => this.updateConnectionInfo());
      this.updateConnectionInfo();
    }
  }

  private updateStatus(online: boolean): void {
    this.currentStatus.online = online;
    this.notifyListeners();

    logger.info(`Network status changed: ${online ? 'online' : 'offline'}`);
  }

  private updateConnectionInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.currentStatus.effectiveType = connection.effectiveType;
      this.currentStatus.downlink = connection.downlink;
      this.currentStatus.rtt = connection.rtt;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        logger.error('Error in network status listener', error);
      }
    });
  }

  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  isOnline(): boolean {
    return this.currentStatus.online;
  }

  onStatusChange(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// ===== API Client Builder =====

export class APIClientBuilder {
  private client: HTTPClient;

  constructor(baseURL?: string) {
    this.client = new HTTPClient(baseURL);
  }

  withAuthToken(token: string): this {
    this.client.setDefaultHeader('Authorization', `Bearer ${token}`);
    return this;
  }

  withApiKey(apiKey: string, headerName: string = 'X-API-Key'): this {
    this.client.setDefaultHeader(headerName, apiKey);
    return this;
  }

  withTimeout(timeout: number): this {
    this.client.addRequestInterceptor((config) => ({
      ...config,
      timeout,
    }));
    return this;
  }

  withRetry(maxRetries: number = 3, delayMs: number = 1000): this {
    this.client.addRequestInterceptor((config) => ({
      ...config,
      retry: {
        maxRetries,
        delayMs,
        backoff: 'exponential',
      },
    }));
    return this;
  }

  withCache(ttl: number = 300000): this {
    this.client.addRequestInterceptor((config) => ({
      ...config,
      cache: {
        enabled: true,
        ttl,
      },
    }));
    return this;
  }

  withLogging(): this {
    this.client.addRequestInterceptor(async (config) => {
      logger.debug('API Request', {
        method: config.method,
        url: config.url,
      });
      return config;
    });

    this.client.addResponseInterceptor({
      onSuccess: async (response) => {
        logger.debug('API Response Success');
        return response;
      },
      onError: async (error) => {
        logger.error('API Response Error', error);
        throw error;
      },
    });

    return this;
  }

  build(): HTTPClient {
    return this.client;
  }
}

// ===== Export Instances =====

export const httpClient = new HTTPClient();
export const networkMonitor = new NetworkMonitor();

export default {
  HTTPClient,
  NetworkError,
  NetworkMonitor,
  APIClientBuilder,
  httpClient,
  networkMonitor,
};
