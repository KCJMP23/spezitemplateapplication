/**
 * Spezi Module Protocol - TypeScript Implementation
 *
 * This implements the core Spezi Module protocol from the iOS framework.
 * Reference: https://github.com/StanfordSpezi/Spezi/blob/main/Sources/Spezi/Module/Module.swift
 *
 * In Spezi iOS, a Module is a protocol that defines a software subsystem providing
 * distinct and reusable functionality. This is the TypeScript equivalent.
 */

/**
 * Module interface - equivalent to Spezi's Module protocol
 *
 * A Module represents a software subsystem that provides distinct and reusable functionality.
 * Modules can:
 * - Enforce constraints on Standards
 * - Depend on other modules
 * - Communicate through information exchange
 * - Integrate with the application lifecycle
 */
export interface Module {
  /**
   * Called during Spezi instance initialization to perform lightweight configuration.
   * Corresponds to Swift's @MainActor func configure()
   *
   * This method should:
   * - Perform synchronous configuration (keep brief)
   * - Start asynchronous tasks if needed (don't await them here)
   * - Register dependencies
   * - Set up observers/subscriptions
   */
  configure(): void | Promise<void>;

  /**
   * Optional lifecycle method called when the module is being torn down
   */
  teardown?(): void | Promise<void>;

  /**
   * Module metadata
   */
  readonly metadata?: ModuleMetadata;
}

/**
 * Module metadata for identification and documentation
 */
export interface ModuleMetadata {
  /**
   * Unique identifier for the module
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Module version
   */
  version?: string;

  /**
   * Module description
   */
  description?: string;

  /**
   * Module dependencies (IDs of required modules)
   */
  dependencies?: string[];
}

/**
 * Base Module class with default implementation
 *
 * Provides a default empty implementation of configure(),
 * matching Spezi's protocol extension behavior.
 */
export abstract class BaseModule implements Module {
  abstract metadata: ModuleMetadata;

  /**
   * Default configure implementation - can be overridden
   */
  configure(): void {
    // Default empty implementation
  }

  /**
   * Default teardown implementation - can be overridden
   */
  teardown(): void {
    // Default empty implementation
  }
}

/**
 * Module configuration options
 */
export interface ModuleConfiguration {
  /**
   * Module instance
   */
  module: Module;

  /**
   * Whether the module is enabled
   */
  enabled?: boolean;

  /**
   * Module-specific configuration
   */
  config?: Record<string, any>;
}

/**
 * Module state tracking
 */
export enum ModuleState {
  NotConfigured = 'not_configured',
  Configuring = 'configuring',
  Configured = 'configured',
  Failed = 'failed',
}

/**
 * Module lifecycle events
 */
export type ModuleLifecycleEvent =
  | { type: 'configuring'; module: Module }
  | { type: 'configured'; module: Module }
  | { type: 'failed'; module: Module; error: Error }
  | { type: 'tearing_down'; module: Module }
  | { type: 'torn_down'; module: Module };

/**
 * Module lifecycle listener
 */
export type ModuleLifecycleListener = (event: ModuleLifecycleEvent) => void;
