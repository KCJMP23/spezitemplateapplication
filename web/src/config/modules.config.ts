/**
 * Modular Configuration System
 *
 * This configuration allows you to enable/disable INTELLIC modules based on your app's needs.
 * Each module can be independently enabled or disabled to reduce bundle size and complexity.
 *
 * Usage:
 * 1. Set modules to `true` to enable, `false` to disable
 * 2. Disabled modules will not be imported or initialized
 * 3. Use conditional imports based on this configuration
 */

export interface ModuleConfig {
  // ===== Core Infrastructure =====
  intellicKit: boolean;             // Event bus, DI, lifecycle management (REQUIRED)
  accessGuard: boolean;          // RBAC, permissions, HIPAA compliance
  networking: boolean;           // HTTP client, API utilities

  // ===== Storage & Data =====
  storage: boolean;              // Offline-first storage with IndexedDB
  scheduler: boolean;            // Task scheduling with recurrence
  notifications: boolean;        // Push notifications and reminders

  // ===== Device & Sensors =====
  devices: boolean;              // Device capability detection
  bluetooth: boolean;            // Bluetooth device connectivity
  location: boolean;             // Geolocation and geofencing
  sensorKit: boolean;            // Motion and environmental sensors

  // ===== Healthcare Core =====
  fhir: boolean;                 // FHIR R4 resources (REQUIRED for healthcare apps)
  fhirAdapters: boolean;         // FHIR converters and SMART on FHIR
  healthData: boolean;           // Health data tracking
  questionnaire: boolean;        // FHIR questionnaires

  // ===== Patient Features =====
  consent: boolean;              // Digital consent management
  medication: boolean;           // Medication tracking and adherence
  chat: boolean;                 // Patient-provider messaging

  // ===== Advanced Features =====
  study: boolean;                // Clinical study management
  llm: boolean;                  // AI/LLM integration
  dataPipeline: boolean;         // ETL and data processing
  speech: boolean;               // Speech recognition and synthesis

  // ===== UI Components =====
  intellicViews: boolean;           // Common UI components
  license: boolean;              // License and attribution display
}

// ===== Default Configuration =====
// This enables all modules by default. Customize for your app.

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  // Core (always recommended)
  intellicKit: true,
  accessGuard: true,
  networking: true,

  // Storage & Data
  storage: true,
  scheduler: true,
  notifications: true,

  // Device & Sensors
  devices: true,
  bluetooth: true,
  location: true,
  sensorKit: true,

  // Healthcare Core
  fhir: true,
  fhirAdapters: true,
  healthData: true,
  questionnaire: true,

  // Patient Features
  consent: true,
  medication: true,
  chat: true,

  // Advanced Features
  study: true,
  llm: false,                     // Disabled by default (requires API keys)
  dataPipeline: true,
  speech: true,

  // UI Components
  intellicViews: true,
  license: true,
};

// ===== Preset Configurations =====

export const MINIMAL_CONFIG: ModuleConfig = {
  intellicKit: true,
  accessGuard: true,
  networking: true,
  storage: true,
  scheduler: false,
  notifications: false,
  devices: false,
  bluetooth: false,
  location: false,
  sensorKit: false,
  fhir: true,
  fhirAdapters: false,
  healthData: true,
  questionnaire: false,
  consent: true,
  medication: false,
  chat: false,
  study: false,
  llm: false,
  dataPipeline: false,
  speech: false,
  intellicViews: true,
  license: true,
};

export const PATIENT_APP_CONFIG: ModuleConfig = {
  intellicKit: true,
  accessGuard: true,
  networking: true,
  storage: true,
  scheduler: true,
  notifications: true,
  devices: true,
  bluetooth: true,
  location: false,
  sensorKit: true,
  fhir: true,
  fhirAdapters: true,
  healthData: true,
  questionnaire: true,
  consent: true,
  medication: true,
  chat: true,
  study: false,
  llm: false,
  dataPipeline: false,
  speech: false,
  intellicViews: true,
  license: true,
};

export const PROVIDER_APP_CONFIG: ModuleConfig = {
  intellicKit: true,
  accessGuard: true,
  networking: true,
  storage: true,
  scheduler: true,
  notifications: true,
  devices: false,
  bluetooth: false,
  location: false,
  sensorKit: false,
  fhir: true,
  fhirAdapters: true,
  healthData: true,
  questionnaire: true,
  consent: true,
  medication: true,
  chat: true,
  study: false,
  llm: true,
  dataPipeline: true,
  speech: false,
  intellicViews: true,
  license: true,
};

export const RESEARCHER_APP_CONFIG: ModuleConfig = {
  intellicKit: true,
  accessGuard: true,
  networking: true,
  storage: true,
  scheduler: false,
  notifications: false,
  devices: false,
  bluetooth: false,
  location: false,
  sensorKit: false,
  fhir: true,
  fhirAdapters: true,
  healthData: true,
  questionnaire: true,
  consent: true,
  medication: false,
  chat: false,
  study: true,
  llm: true,
  dataPipeline: true,
  speech: false,
  intellicViews: true,
  license: true,
};

// ===== Active Configuration =====
// Change this to use different presets or create your own configuration

export const ACTIVE_MODULE_CONFIG: ModuleConfig = DEFAULT_MODULE_CONFIG;

// ===== Module Dependencies =====
// This defines which modules depend on others

export const MODULE_DEPENDENCIES: Record<keyof ModuleConfig, Array<keyof ModuleConfig>> = {
  intellicKit: [],
  accessGuard: ['intellicKit'],
  networking: ['intellicKit', 'storage'],
  storage: ['intellicKit'],
  scheduler: ['intellicKit', 'storage', 'notifications'],
  notifications: ['intellicKit', 'storage'],
  devices: ['intellicKit'],
  bluetooth: ['intellicKit', 'devices'],
  location: ['intellicKit', 'devices'],
  sensorKit: ['intellicKit', 'devices'],
  fhir: [],
  fhirAdapters: ['fhir', 'storage'],
  healthData: ['intellicKit', 'storage', 'fhir'],
  questionnaire: ['intellicKit', 'storage', 'fhir', 'scheduler'],
  consent: ['intellicKit', 'storage'],
  medication: ['intellicKit', 'storage', 'scheduler', 'notifications', 'fhir'],
  chat: ['intellicKit', 'storage', 'notifications'],
  study: ['intellicKit', 'storage', 'accessGuard'],
  llm: ['intellicKit', 'networking'],
  dataPipeline: ['intellicKit', 'storage'],
  speech: ['intellicKit'],
  intellicViews: [],
  license: [],
};

// ===== Configuration Validator =====

export function validateModuleConfig(config: ModuleConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required modules
  if (!config.intellicKit) {
    errors.push('IntellicKit is required and cannot be disabled');
  }

  // Check dependencies
  Object.entries(config).forEach(([moduleName, enabled]) => {
    if (enabled) {
      const deps = MODULE_DEPENDENCIES[moduleName as keyof ModuleConfig] || [];
      deps.forEach((dep) => {
        if (!config[dep]) {
          errors.push(
            `Module "${moduleName}" requires "${dep}" to be enabled`
          );
        }
      });
    }
  });

  // Warnings for recommended modules
  if (config.fhir && !config.fhirAdapters) {
    warnings.push('FHIR Adapters module is recommended when using FHIR');
  }

  if (config.scheduler && !config.notifications) {
    warnings.push('Notifications module is recommended when using Scheduler');
  }

  if (config.bluetooth && !config.devices) {
    warnings.push('Devices module is required for Bluetooth');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===== Export Utilities =====

export function isModuleEnabled(moduleName: keyof ModuleConfig): boolean {
  return ACTIVE_MODULE_CONFIG[moduleName];
}

export function getEnabledModules(): Array<keyof ModuleConfig> {
  return Object.entries(ACTIVE_MODULE_CONFIG)
    .filter(([_, enabled]) => enabled)
    .map(([name, _]) => name as keyof ModuleConfig);
}

export function getDisabledModules(): Array<keyof ModuleConfig> {
  return Object.entries(ACTIVE_MODULE_CONFIG)
    .filter(([_, enabled]) => !enabled)
    .map(([name, _]) => name as keyof ModuleConfig);
}

export default ACTIVE_MODULE_CONFIG;
