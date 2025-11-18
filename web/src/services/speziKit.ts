/**
 * SpeziKit React Migration
 *
 * Core Spezi utilities and helpers:
 * - Component lifecycle management
 * - Dependency injection
 * - Module configuration
 * - Event bus
 * - State management helpers
 */

import { logger } from '@/utils/logger';

// ===== Event Bus =====

type EventCallback = (...args: any[]) => void;

export class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          logger.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  clear(): void {
    this.events.clear();
  }
}

// Global event bus instance
export const globalEventBus = new EventBus();

// ===== Module System =====

export interface SpeziModule {
  name: string;
  version: string;
  dependencies?: string[];
  configure?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export class ModuleManager {
  private modules: Map<string, SpeziModule> = new Map();
  private initialized: Set<string> = new Set();

  register(module: SpeziModule): void {
    if (this.modules.has(module.name)) {
      logger.warn(`Module ${module.name} is already registered`);
      return;
    }

    this.modules.set(module.name, module);
    logger.info(`Registered module: ${module.name} v${module.version}`);
  }

  async initialize(moduleName: string): Promise<void> {
    if (this.initialized.has(moduleName)) {
      return;
    }

    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Module ${moduleName} not found`);
    }

    // Initialize dependencies first
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        await this.initialize(dep);
      }
    }

    // Configure module
    if (module.configure) {
      logger.info(`Initializing module: ${moduleName}`);
      await module.configure();
    }

    this.initialized.add(moduleName);
  }

  async initializeAll(): Promise<void> {
    const moduleNames = Array.from(this.modules.keys());
    for (const name of moduleNames) {
      await this.initialize(name);
    }
  }

  async cleanup(): Promise<void> {
    for (const [name, module] of this.modules) {
      if (module.cleanup && this.initialized.has(name)) {
        logger.info(`Cleaning up module: ${name}`);
        await module.cleanup();
      }
    }
    this.initialized.clear();
  }

  getModule(name: string): SpeziModule | undefined {
    return this.modules.get(name);
  }

  isInitialized(name: string): boolean {
    return this.initialized.has(name);
  }
}

export const moduleManager = new ModuleManager();

// ===== Dependency Injection =====

export class ServiceContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  registerFactory<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    // Check if service already exists
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Try to create from factory
    const factory = this.factories.get(name);
    if (factory) {
      const service = factory();
      this.services.set(name, service);
      return service as T;
    }

    throw new Error(`Service ${name} not found`);
  }

  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

export const serviceContainer = new ServiceContainer();

// ===== Component Lifecycle =====

export interface LifecycleAware {
  onMount?(): void | Promise<void>;
  onUnmount?(): void | Promise<void>;
  onUpdate?(): void | Promise<void>;
}

export class LifecycleManager {
  private components: Map<string, LifecycleAware> = new Map();

  register(id: string, component: LifecycleAware): void {
    this.components.set(id, component);
  }

  unregister(id: string): void {
    this.components.delete(id);
  }

  async notifyMount(id: string): Promise<void> {
    const component = this.components.get(id);
    if (component?.onMount) {
      await component.onMount();
    }
  }

  async notifyUnmount(id: string): Promise<void> {
    const component = this.components.get(id);
    if (component?.onUnmount) {
      await component.onUnmount();
    }
    this.unregister(id);
  }

  async notifyUpdate(id: string): Promise<void> {
    const component = this.components.get(id);
    if (component?.onUpdate) {
      await component.onUpdate();
    }
  }
}

export const lifecycleManager = new LifecycleManager();

// ===== State Management =====

type StateListener<T> = (state: T) => void;

export class StateManager<T> {
  private state: T;
  private listeners: Set<StateListener<T>> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  setState(newState: Partial<T> | ((prevState: T) => T)): void {
    if (typeof newState === 'function') {
      this.state = newState(this.state);
    } else {
      this.state = { ...this.state, ...newState };
    }

    this.notifyListeners();
  }

  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        logger.error('Error in state listener:', error);
      }
    });
  }

  reset(initialState: T): void {
    this.state = initialState;
    this.notifyListeners();
  }
}

// ===== Configuration Manager =====

export interface AppConfiguration {
  environment: 'development' | 'staging' | 'production';
  apiUrl?: string;
  features: Record<string, boolean>;
  settings: Record<string, any>;
}

export class ConfigurationManager {
  private config: AppConfiguration;

  constructor(initialConfig: AppConfiguration) {
    this.config = initialConfig;
  }

  get<K extends keyof AppConfiguration>(key: K): AppConfiguration[K] {
    return this.config[key];
  }

  set<K extends keyof AppConfiguration>(key: K, value: AppConfiguration[K]): void {
    this.config[key] = value;
  }

  isFeatureEnabled(feature: string): boolean {
    return this.config.features[feature] === true;
  }

  getSetting(key: string, defaultValue?: any): any {
    return this.config.settings[key] ?? defaultValue;
  }

  setSetting(key: string, value: any): void {
    this.config.settings[key] = value;
  }

  getAll(): AppConfiguration {
    return { ...this.config };
  }
}

// ===== Performance Monitor =====

export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      logger.warn(`Start mark ${startMark} not found`);
      return 0;
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (endMark && !end) {
      logger.warn(`End mark ${endMark} not found`);
      return 0;
    }

    const duration = (end as number) - start;
    this.measures.set(name, duration);

    logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  clearMarks(): void {
    this.marks.clear();
  }

  clearMeasures(): void {
    this.measures.clear();
  }

  clear(): void {
    this.clearMarks();
    this.clearMeasures();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ===== Error Boundary Helper =====

export interface ErrorInfo {
  componentStack: string;
  error: Error;
  timestamp: Date;
}

export class ErrorTracker {
  private errors: ErrorInfo[] = [];
  private maxErrors: number = 100;

  trackError(error: Error, componentStack: string): void {
    const errorInfo: ErrorInfo = {
      error,
      componentStack,
      timestamp: new Date(),
    };

    this.errors.push(errorInfo);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    logger.error('Component error tracked:', {
      message: error.message,
      stack: error.stack,
      componentStack,
    });
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errors.slice(-count);
  }
}

export const errorTracker = new ErrorTracker();

// Export default object with all utilities
export default {
  EventBus,
  globalEventBus,
  ModuleManager,
  moduleManager,
  ServiceContainer,
  serviceContainer,
  LifecycleManager,
  lifecycleManager,
  StateManager,
  ConfigurationManager,
  PerformanceMonitor,
  performanceMonitor,
  ErrorTracker,
  errorTracker,
};
