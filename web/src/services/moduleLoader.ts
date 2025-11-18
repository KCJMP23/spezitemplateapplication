/**
 * Dynamic Module Loader
 *
 * Loads only enabled modules based on configuration.
 * This reduces bundle size and improves performance.
 */

import { ACTIVE_MODULE_CONFIG, validateModuleConfig, type ModuleConfig } from '../config/modules.config';
import { logger } from '../utils/logger';

export interface LoadedModule {
  name: string;
  service: any;
  initialized: boolean;
  error?: Error;
}

export class ModuleLoader {
  private loadedModules: Map<string, LoadedModule> = new Map();
  private config: ModuleConfig;

  constructor(config: ModuleConfig = ACTIVE_MODULE_CONFIG) {
    this.config = config;
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const validation = validateModuleConfig(this.config);

    if (!validation.valid) {
      logger.error('Invalid module configuration', { errors: validation.errors });
      throw new Error(`Module configuration errors: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      logger.warn('Module configuration warnings', { warnings: validation.warnings });
    }

    logger.info('Module configuration validated', {
      enabled: Object.entries(this.config).filter(([_, enabled]) => enabled).length,
      total: Object.keys(this.config).length,
    });
  }

  /**
   * Load all enabled modules
   */
  async loadAll(): Promise<Map<string, LoadedModule>> {
    logger.info('Loading enabled modules...');

    // Core Infrastructure
    if (this.config.speziKit) await this.loadModule('speziKit', () => import('./speziKit'));
    if (this.config.accessGuard) await this.loadModule('accessGuard', () => import('./accessGuard'));
    if (this.config.networking) await this.loadModule('networking', () => import('./networking'));

    // Storage & Data
    if (this.config.storage) await this.loadModule('storage', () => import('./storage'));
    if (this.config.scheduler) await this.loadModule('scheduler', () => import('./scheduler'));
    if (this.config.notifications) await this.loadModule('notification', () => import('./notification'));

    // Device & Sensors
    if (this.config.devices) await this.loadModule('devices', () => import('./devices'));
    if (this.config.bluetooth) await this.loadModule('bluetooth', () => import('./bluetooth'));
    if (this.config.location) await this.loadModule('location', () => import('./location'));
    if (this.config.sensorKit) await this.loadModule('sensorKit', () => import('./sensorKit'));

    // Healthcare Core
    if (this.config.fhir) await this.loadModule('fhir', () => import('./fhir'));
    if (this.config.fhirAdapters) await this.loadModule('fhirAdapters', () => import('./fhirAdapters'));
    if (this.config.healthData) await this.loadModule('healthData', () => import('./healthData'));
    if (this.config.questionnaire) await this.loadModule('questionnaire', () => import('./questionnaire'));

    // Patient Features
    if (this.config.consent) await this.loadModule('consent', () => import('./consent'));
    if (this.config.medication) await this.loadModule('medication', () => import('./medication'));
    if (this.config.chat) await this.loadModule('chat', () => import('./chat'));

    // Advanced Features
    if (this.config.study) await this.loadModule('study', () => import('./study'));
    if (this.config.llm) await this.loadModule('llm', () => import('./llm'));
    if (this.config.dataPipeline) await this.loadModule('dataPipeline', () => import('./dataPipeline'));
    if (this.config.speech) await this.loadModule('speech', () => import('./speech'));

    const loaded = this.loadedModules.size;
    const failed = Array.from(this.loadedModules.values()).filter((m) => m.error).length;

    logger.info('Module loading complete', {
      loaded,
      failed,
      total: Object.keys(this.config).length,
    });

    return this.loadedModules;
  }

  /**
   * Load a single module
   */
  private async loadModule(
    name: string,
    importFn: () => Promise<any>
  ): Promise<void> {
    try {
      logger.debug(`Loading module: ${name}`);

      const module = await importFn();

      this.loadedModules.set(name, {
        name,
        service: module.default || module,
        initialized: true,
      });

      logger.debug(`Module loaded: ${name}`);
    } catch (error) {
      logger.error(`Failed to load module: ${name}`, error);

      this.loadedModules.set(name, {
        name,
        service: null,
        initialized: false,
        error: error as Error,
      });
    }
  }

  /**
   * Get a loaded module
   */
  getModule<T = any>(name: string): T | null {
    const module = this.loadedModules.get(name);
    return module?.service || null;
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(name: string): boolean {
    const module = this.loadedModules.get(name);
    return module?.initialized || false;
  }

  /**
   * Get all loaded modules
   */
  getLoadedModules(): LoadedModule[] {
    return Array.from(this.loadedModules.values());
  }

  /**
   * Get loading report
   */
  getReport(): {
    total: number;
    loaded: number;
    failed: number;
    modules: LoadedModule[];
  } {
    const modules = Array.from(this.loadedModules.values());
    const loaded = modules.filter((m) => m.initialized).length;
    const failed = modules.filter((m) => m.error).length;

    return {
      total: modules.length,
      loaded,
      failed,
      modules,
    };
  }
}

// ===== Conditional Export Helper =====

/**
 * Helper to conditionally export services based on configuration
 */
export function conditionalService<T>(
  moduleName: keyof ModuleConfig,
  service: T
): T | null {
  return ACTIVE_MODULE_CONFIG[moduleName] ? service : null;
}

// ===== Global Module Loader =====

export const moduleLoader = new ModuleLoader();

export default moduleLoader;
