/**
 * Spezi Standard Protocol - TypeScript Implementation
 *
 * This implements the core Spezi Standard protocol from the iOS framework.
 * Reference: https://github.com/StanfordSpezi/Spezi
 *
 * In Spezi iOS, a Standard is an actor that orchestrates data flow between modules.
 * This is the TypeScript equivalent using async patterns.
 */

import type { Module } from './Module';

/**
 * Standard interface - equivalent to Spezi's Standard protocol
 *
 * A Standard orchestrates data flow in an application by meeting requirements
 * defined by modules. Standards can be customized when application-specific
 * coordination logic is needed.
 */
export interface Standard {
  /**
   * Initialize the Standard with configured modules
   */
  initialize(modules: Module[]): Promise<void>;

  /**
   * Get a module by its metadata ID
   */
  getModule<T extends Module>(moduleId: string): T | undefined;

  /**
   * Check if a module is configured
   */
  hasModule(moduleId: string): boolean;

  /**
   * Teardown the Standard and all modules
   */
  teardown(): Promise<void>;
}

/**
 * Base Standard implementation
 *
 * Provides a basic Standard coordinator that manages module lifecycle
 * and dependency resolution.
 */
export abstract class BaseStandard implements Standard {
  protected modules: Map<string, Module> = new Map();
  protected moduleStates: Map<string, 'configuring' | 'configured' | 'failed'> = new Map();

  /**
   * Initialize all modules in dependency order
   */
  async initialize(modules: Module[]): Promise<void> {
    // Sort modules by dependencies (topological sort)
    const sorted = this.topologicalSort(modules);

    // Configure each module
    for (const module of sorted) {
      const id = module.metadata?.id || module.constructor.name;
      this.moduleStates.set(id, 'configuring');

      try {
        await module.configure();
        this.modules.set(id, module);
        this.moduleStates.set(id, 'configured');
      } catch (error) {
        this.moduleStates.set(id, 'failed');
        throw new Error(
          `Failed to configure module ${id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Get a module by ID
   */
  getModule<T extends Module>(moduleId: string): T | undefined {
    return this.modules.get(moduleId) as T | undefined;
  }

  /**
   * Check if module is configured
   */
  hasModule(moduleId: string): boolean {
    return this.moduleStates.get(moduleId) === 'configured';
  }

  /**
   * Teardown all modules
   */
  async teardown(): Promise<void> {
    // Teardown in reverse order
    const modules = Array.from(this.modules.values()).reverse();

    for (const module of modules) {
      if (module.teardown) {
        try {
          await module.teardown();
        } catch (error) {
          console.error('Error tearing down module:', error);
        }
      }
    }

    this.modules.clear();
    this.moduleStates.clear();
  }

  /**
   * Topological sort of modules based on dependencies
   */
  protected topologicalSort(modules: Module[]): Module[] {
    const sorted: Module[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (module: Module): void => {
      const id = module.metadata?.id || module.constructor.name;

      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected for module: ${id}`);
      }

      visiting.add(id);

      // Visit dependencies first
      const dependencies = module.metadata?.dependencies || [];
      for (const depId of dependencies) {
        const depModule = modules.find((m) => m.metadata?.id === depId);
        if (depModule) {
          visit(depModule);
        } else {
          throw new Error(`Module ${id} depends on ${depId}, but ${depId} is not configured`);
        }
      }

      visiting.delete(id);
      visited.add(id);
      sorted.push(module);
    };

    modules.forEach(visit);
    return sorted;
  }
}

/**
 * Constraint protocols - TypeScript equivalents of Spezi constraints
 */

/**
 * HealthKit constraint - Standard must handle HealthKit data
 */
export interface HealthKitConstraint {
  /**
   * Add a health sample
   */
  addHealthSample(sample: any): Promise<void>;

  /**
   * Remove a health sample
   */
  removeHealthSample(sampleId: string): Promise<void>;
}

/**
 * Consent constraint - Standard must handle consent documents
 */
export interface ConsentConstraint {
  /**
   * Store a consent document
   */
  storeConsent(consent: any): Promise<void>;
}

/**
 * Account notification constraint - Standard must handle account events
 */
export interface AccountNotifyConstraint {
  /**
   * Respond to account events
   */
  respondToAccountEvent(event: AccountEvent): Promise<void>;
}

/**
 * Account event types
 */
export type AccountEvent =
  | { type: 'account_created'; accountId: string }
  | { type: 'account_updated'; accountId: string }
  | { type: 'account_deleting'; accountId: string };

/**
 * Application Standard - A Standard that implements all common constraints
 */
export abstract class ApplicationStandard
  extends BaseStandard
  implements HealthKitConstraint, ConsentConstraint, AccountNotifyConstraint
{
  abstract addHealthSample(sample: any): Promise<void>;
  abstract removeHealthSample(sampleId: string): Promise<void>;
  abstract storeConsent(consent: any): Promise<void>;
  abstract respondToAccountEvent(event: AccountEvent): Promise<void>;
}
