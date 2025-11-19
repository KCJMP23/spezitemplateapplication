/**
 * Module Configurator Service
 *
 * Handles Spezi module configuration, initialization, and persistence.
 */

import { healthcareStandard } from '@/spezi-compat';
import { schedulerModule } from '@/spezi-compat/modules/SchedulerModule';
import type { WizardConfig, ModuleConfig } from '@/components/SpeziConfigWizard';
import { logger } from '@/utils/logger';
import storageService from './storage';

const CONFIG_STORAGE_KEY = 'spezi_module_config';

export interface InitializedModule {
  id: string;
  name: string;
  version?: string;
  status: 'initialized' | 'failed' | 'pending';
  error?: string;
}

class ModuleConfiguratorService {
  private initialized = false;
  private currentConfig: WizardConfig | null = null;

  /**
   * Initialize Spezi modules based on wizard configuration
   */
  async initializeFromConfig(config: WizardConfig): Promise<InitializedModule[]> {
    try {
      logger.info('Initializing Spezi modules from configuration', {
        appType: config.appType,
        moduleCount: config.modules.filter((m) => m.enabled).length,
      });

      const results: InitializedModule[] = [];
      const modulesToInit: any[] = [];

      // Map configuration to actual module instances
      for (const moduleConfig of config.modules) {
        if (!moduleConfig.enabled) continue;

        try {
          const moduleInstance = await this.createModuleInstance(moduleConfig);
          if (moduleInstance) {
            modulesToInit.push(moduleInstance);
            results.push({
              id: moduleConfig.id,
              name: moduleConfig.name,
              status: 'pending',
            });
          }
        } catch (error) {
          logger.error(`Failed to create module instance: ${moduleConfig.id}`, error);
          results.push({
            id: moduleConfig.id,
            name: moduleConfig.name,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Initialize the healthcare standard with all modules
      try {
        await healthcareStandard.initialize(modulesToInit);
        this.initialized = true;
        this.currentConfig = config;

        // Mark all modules as initialized
        results.forEach((result) => {
          if (result.status === 'pending') {
            result.status = 'initialized';
          }
        });

        // Save configuration to storage
        await this.saveConfiguration(config);

        logger.info('Spezi modules initialized successfully', {
          moduleCount: results.filter((r) => r.status === 'initialized').length,
        });
      } catch (error) {
        logger.error('Failed to initialize healthcare standard', error);
        results.forEach((result) => {
          if (result.status === 'pending') {
            result.status = 'failed';
            result.error = error instanceof Error ? error.message : String(error);
          }
        });
      }

      return results;
    } catch (error) {
      logger.error('Failed to initialize modules from configuration', error);
      throw error;
    }
  }

  /**
   * Create a module instance from configuration
   */
  private async createModuleInstance(config: ModuleConfig): Promise<any> {
    // For now, we only have SchedulerModule implemented
    // In the future, we'll dynamically import other modules
    switch (config.id) {
      case 'scheduler':
        return schedulerModule;

      // Placeholder for future modules
      case 'questionnaire':
      case 'healthData':
      case 'wearables':
      case 'consent':
      case 'chat':
      case 'notifications':
      case 'study':
      case 'dataExport':
      case 'medication':
      case 'llm':
      case 'location':
      case 'storage':
        logger.warn(`Module ${config.id} not yet implemented in Spezi layer`);
        return null;

      default:
        logger.warn(`Unknown module: ${config.id}`);
        return null;
    }
  }

  /**
   * Save configuration to persistent storage
   */
  async saveConfiguration(config: WizardConfig): Promise<void> {
    try {
      await storageService.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      logger.debug('Configuration saved to storage');
    } catch (error) {
      logger.error('Failed to save configuration', error);
    }
  }

  /**
   * Load configuration from storage
   */
  async loadConfiguration(): Promise<WizardConfig | null> {
    try {
      const configStr = await storageService.getItem(CONFIG_STORAGE_KEY);
      if (configStr) {
        const config = JSON.parse(configStr) as WizardConfig;
        this.currentConfig = config;
        return config;
      }
      return null;
    } catch (error) {
      logger.error('Failed to load configuration', error);
      return null;
    }
  }

  /**
   * Check if modules have been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): WizardConfig | null {
    return this.currentConfig;
  }

  /**
   * Generate configuration code snippet
   */
  generateConfigCode(config: WizardConfig): string {
    const enabledModules = config.modules.filter((m) => m.enabled);

    return `
// Spezi Module Configuration
// Generated from configuration wizard

import { initializeSpezi } from '@/spezi-compat';

async function initializeApp() {
  const config = await initializeSpezi({
    modules: [${enabledModules.map((m) => `'${m.id}'`).join(', ')}],
    config: {
      // Add module-specific configuration here
    }
  });

  console.log('Spezi modules initialized:', config);
}

initializeApp();
`.trim();
  }

  /**
   * Export configuration as JSON
   */
  exportConfiguration(config: WizardConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfiguration(json: string): WizardConfig {
    try {
      const config = JSON.parse(json) as WizardConfig;
      // Validate structure
      if (!config.appType || !config.modules) {
        throw new Error('Invalid configuration format');
      }
      return config;
    } catch (error) {
      logger.error('Failed to import configuration', error);
      throw new Error('Invalid configuration JSON');
    }
  }
}

const moduleConfiguratorService = new ModuleConfiguratorService();
export default moduleConfiguratorService;
