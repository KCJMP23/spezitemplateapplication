/**
 * Spezi Dependency Injection - TypeScript Implementation
 *
 * This implements Spezi's @Dependency property wrapper pattern for TypeScript.
 * In Swift, @Dependency is a property wrapper that provides automatic dependency injection.
 * In TypeScript, we use decorators and a dependency container.
 *
 * Reference: Spezi's @Dependency property wrapper
 */

import type { Module } from './Module';

/**
 * Dependency container - manages module instances
 */
export class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Map<string, Module> = new Map();
  private factories: Map<string, () => Module> = new Map();

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Register a module instance
   */
  register<T extends Module>(moduleId: string, instance: T): void {
    this.dependencies.set(moduleId, instance);
  }

  /**
   * Register a module factory
   */
  registerFactory<T extends Module>(moduleId: string, factory: () => T): void {
    this.factories.set(moduleId, factory);
  }

  /**
   * Resolve a dependency
   */
  resolve<T extends Module>(moduleId: string): T {
    // Check if already instantiated
    let instance = this.dependencies.get(moduleId);

    if (!instance) {
      // Try to create from factory
      const factory = this.factories.get(moduleId);
      if (factory) {
        instance = factory();
        this.dependencies.set(moduleId, instance);
      } else {
        throw new Error(`Dependency not found: ${moduleId}. Make sure to register it first.`);
      }
    }

    return instance as T;
  }

  /**
   * Check if a dependency exists
   */
  has(moduleId: string): boolean {
    return this.dependencies.has(moduleId) || this.factories.has(moduleId);
  }

  /**
   * Clear all dependencies (useful for testing)
   */
  clear(): void {
    this.dependencies.clear();
    this.factories.clear();
  }
}

/**
 * Dependency decorator - TypeScript equivalent of @Dependency
 *
 * Usage:
 * ```typescript
 * class MyModule extends BaseModule {
 *   @Dependency('scheduler')
 *   private scheduler!: SchedulerModule;
 *
 *   configure() {
 *     this.scheduler.scheduleTask(...);
 *   }
 * }
 * ```
 */
export function Dependency(moduleId: string) {
  return function (target: any, propertyKey: string) {
    // Define a getter that resolves the dependency lazily
    Object.defineProperty(target, propertyKey, {
      get() {
        const container = DependencyContainer.getInstance();
        return container.resolve(moduleId);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Injectable decorator - marks a class as injectable
 *
 * Usage:
 * ```typescript
 * @Injectable('my-module')
 * class MyModule extends BaseModule {
 *   // ...
 * }
 * ```
 */
export function Injectable(moduleId: string) {
  return function <T extends { new (...args: any[]): Module }>(constructor: T) {
    // Register the constructor as a factory
    DependencyContainer.getInstance().registerFactory(moduleId, () => new constructor());
    return constructor;
  };
}

/**
 * Helper function to manually inject dependencies (alternative to decorator)
 *
 * Usage:
 * ```typescript
 * const scheduler = inject<SchedulerModule>('scheduler');
 * ```
 */
export function inject<T extends Module>(moduleId: string): T {
  return DependencyContainer.getInstance().resolve<T>(moduleId);
}

/**
 * Helper to check if a dependency is registered
 */
export function hasDependency(moduleId: string): boolean {
  return DependencyContainer.getInstance().has(moduleId);
}

/**
 * Application context - holds the Standard instance
 * Equivalent to Spezi's @Application property wrapper
 */
export class ApplicationContext {
  private static standard: any;

  static setStandard(standard: any): void {
    ApplicationContext.standard = standard;
  }

  static getStandard<T>(): T {
    if (!ApplicationContext.standard) {
      throw new Error('Application Standard not set. Call ApplicationContext.setStandard() first.');
    }
    return ApplicationContext.standard as T;
  }
}

/**
 * Application decorator - provides access to the Standard
 *
 * Usage:
 * ```typescript
 * class MyModule extends BaseModule {
 *   @Application()
 *   private standard!: MyApplicationStandard;
 * }
 * ```
 */
export function Application() {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return ApplicationContext.getStandard();
      },
      enumerable: true,
      configurable: true,
    });
  };
}
