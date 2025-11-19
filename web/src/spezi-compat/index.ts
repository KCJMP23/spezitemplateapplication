/**
 * INTELLIC Compatibility Layer - Main Export
 *
 * This module provides INTELLIC-compatible architecture for TypeScript/React applications.
 * It allows using INTELLIC patterns (Module, Standard, Dependency Injection) on the web.
 *
 * See README.md for detailed documentation and examples.
 */

import type { HealthcareStandard as HealthcareStandardType } from './HealthcareStandard';

// Core INTELLIC patterns
export { type Module, BaseModule, type ModuleMetadata, type ModuleConfiguration, ModuleState } from './Module';
export {
  type Standard,
  BaseStandard,
  ApplicationStandard,
  type HealthKitConstraint,
  type ConsentConstraint,
  type AccountNotifyConstraint,
  type AccountEvent,
} from './Standard';
export {
  DependencyContainer,
  Dependency,
  Injectable,
  inject,
  hasDependency,
  ApplicationContext,
  Application,
} from './Dependency';

// Concrete implementations
export { HealthcareStandard, healthcareStandard, type ConsentDocument } from './HealthcareStandard';
export type { HealthcareStandard as HealthcareStandardType } from './HealthcareStandard';

// Module wrappers
export { SchedulerModule, schedulerModule, type TaskCategory, type Schedule, type CompletionPolicy, type TaskPredicate } from './modules/SchedulerModule';

/**
 * Initialize the INTELLIC-compatible system
 *
 * This is a convenience function that sets up the Healthcare Standard
 * with all available modules.
 *
 * @example
 * import { initializeSpezi } from '@/spezi-compat';
 *
 * await initializeSpezi({
 *   modules: ['scheduler', 'storage', 'notifications'],
 *   config: {
 *     scheduler: { }
 *   }
 * });
 */
export async function initializeSpezi(options?: {
  modules?: string[];
  config?: Record<string, any>;
}): Promise<HealthcareStandardType> {
  const { modules = ['scheduler'] } = options || {};

  // Import and create modules based on configuration
  const moduleInstances: any[] = [];

  if (modules.includes('scheduler')) {
    const { schedulerModule } = await import('./modules/SchedulerModule');
    moduleInstances.push(schedulerModule);
  }

  // Get the singleton instance
  const { healthcareStandard: standardInstance } = await import('./HealthcareStandard');

  // Initialize the standard
  await standardInstance.initialize(moduleInstances);

  return standardInstance;
}

/**
 * Get the global healthcare standard instance
 */
export async function getHealthcareStandard(): Promise<HealthcareStandardType> {
  const { healthcareStandard: standardInstance } = await import('./HealthcareStandard');
  return standardInstance;
}
