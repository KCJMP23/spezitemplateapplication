# Spezi Module System Guide

## Overview

The Spezi React PWA uses a fully modular architecture that allows you to enable or disable modules based on your app's needs. This reduces bundle size, improves performance, and simplifies development.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Available Modules](#available-modules)
3. [Module Configuration](#module-configuration)
4. [Preset Configurations](#preset-configurations)
5. [Custom Configuration](#custom-configuration)
6. [Module Dependencies](#module-dependencies)
7. [Dynamic Module Loading](#dynamic-module-loading)
8. [Best Practices](#best-practices)

---

## Quick Start

### Enable/Disable Modules

Edit `src/config/modules.config.ts`:

```typescript
export const ACTIVE_MODULE_CONFIG: ModuleConfig = {
  speziKit: true,           // ✅ Core (required)
  accessGuard: true,        // ✅ Access control
  medication: true,         // ✅ Medication tracking
  bluetooth: false,         // ❌ Disabled - not needed
  llm: false,              // ❌ Disabled - requires API keys
  // ... configure other modules
};
```

### Use a Preset

```typescript
import { PATIENT_APP_CONFIG } from './config/modules.config';

export const ACTIVE_MODULE_CONFIG = PATIENT_APP_CONFIG;
```

---

## Available Modules

### Core Infrastructure (Always Recommended)

| Module | Purpose | Required By |
|--------|---------|-------------|
| **speziKit** | Event bus, DI, lifecycle management | Most modules |
| **accessGuard** | RBAC, permissions, HIPAA compliance | Protected features |
| **networking** | HTTP client, API utilities | External APIs |

### Storage & Data

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| **storage** | Offline-first IndexedDB storage | speziKit |
| **scheduler** | Task scheduling with recurrence | speziKit, storage, notifications |
| **notifications** | Push notifications and reminders | speziKit, storage |

### Device & Sensors

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| **devices** | Device capability detection | speziKit |
| **bluetooth** | BLE health device connectivity | speziKit, devices |
| **location** | Geolocation and geofencing | speziKit, devices |
| **sensorKit** | Motion and environmental sensors | speziKit, devices |

### Healthcare Core

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| **fhir** | FHIR R4 resources | None |
| **fhirAdapters** | FHIR converters, SMART on FHIR | fhir, storage |
| **healthData** | Health data tracking | speziKit, storage, fhir |
| **questionnaire** | FHIR questionnaires | speziKit, storage, fhir, scheduler |

### Patient Features

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| **consent** | Digital consent management | speziKit, storage |
| **medication** | Medication tracking & adherence | speziKit, storage, scheduler, notifications, fhir |
| **chat** | Patient-provider messaging | speziKit, storage, notifications |

### Advanced Features

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| **study** | Clinical study management | speziKit, storage, accessGuard |
| **llm** | AI/LLM integration | speziKit, networking |
| **dataPipeline** | ETL and data processing | speziKit, storage |
| **speech** | Speech recognition & synthesis | speziKit |

### UI Components

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| **speziViews** | Common UI components | None |
| **license** | License and attribution display | None |

---

## Module Configuration

### Configuration File Structure

```typescript
// src/config/modules.config.ts

export interface ModuleConfig {
  // Set each module to true (enabled) or false (disabled)
  speziKit: boolean;
  accessGuard: boolean;
  // ... all other modules
}
```

### Validation

The system automatically validates your configuration:

```typescript
import { validateModuleConfig } from './config/modules.config';

const validation = validateModuleConfig(myConfig);

if (!validation.valid) {
  console.error('Errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

---

## Preset Configurations

### Minimal Configuration
Perfect for simple apps or demos:
```typescript
import { MINIMAL_CONFIG } from './config/modules.config';
```
Enables: Core infrastructure, basic storage, FHIR, health data, consent

### Patient App Configuration
Optimized for patient-facing applications:
```typescript
import { PATIENT_APP_CONFIG } from './config/modules.config';
```
Enables: All patient features, health tracking, medication, chat, Bluetooth devices

### Provider App Configuration
Optimized for healthcare provider dashboards:
```typescript
import { PROVIDER_APP_CONFIG } from './config/modules.config';
```
Enables: Patient management, data review, AI assistance, data pipelines

### Researcher App Configuration
Optimized for research and study management:
```typescript
import { RESEARCHER_APP_CONFIG } from './config/modules.config';
```
Enables: Study management, data analysis, AI, data pipelines

---

## Custom Configuration

### Example: Medication-Only App

```typescript
export const MEDICATION_APP_CONFIG: ModuleConfig = {
  // Core (required)
  speziKit: true,
  accessGuard: true,
  networking: false,

  // Storage
  storage: true,
  scheduler: true,
  notifications: true,

  // Disable devices
  devices: false,
  bluetooth: false,
  location: false,
  sensorKit: false,

  // Healthcare
  fhir: true,
  fhirAdapters: false,
  healthData: false,
  questionnaire: false,

  // Enable medication only
  consent: true,
  medication: true,
  chat: false,

  // Disable advanced
  study: false,
  llm: false,
  dataPipeline: false,
  speech: false,

  // UI
  speziViews: true,
  license: true,
};
```

### Example: Research Data Collection App

```typescript
export const RESEARCH_DATA_CONFIG: ModuleConfig = {
  speziKit: true,
  accessGuard: true,
  networking: true,
  storage: true,
  scheduler: true,
  notifications: true,

  // Enable sensors for data collection
  devices: true,
  bluetooth: true,
  location: true,
  sensorKit: true,

  // Healthcare
  fhir: true,
  fhirAdapters: true,
  healthData: true,
  questionnaire: true,
  consent: true,

  // Disable patient features
  medication: false,
  chat: false,

  // Enable research features
  study: true,
  llm: false,
  dataPipeline: true,
  speech: false,

  speziViews: true,
  license: true,
};
```

---

## Module Dependencies

### Automatic Dependency Resolution

The system automatically checks dependencies:

```typescript
// This will FAIL validation
const INVALID_CONFIG = {
  speziKit: false,      // ❌ Required by most modules
  medication: true,     // ✅ Enabled but needs speziKit
};

// This will PASS validation
const VALID_CONFIG = {
  speziKit: true,       // ✅ Required dependency
  storage: true,        // ✅ Dependency satisfied
  medication: true,     // ✅ All dependencies satisfied
};
```

### Dependency Graph

```
medication
  ├── speziKit (required)
  ├── storage (required)
  ├── scheduler (required)
  │   ├── speziKit
  │   ├── storage
  │   └── notifications
  ├── notifications (required)
  └── fhir (required)
```

---

## Dynamic Module Loading

### Using the Module Loader

```typescript
import { moduleLoader } from './services/moduleLoader';

// Load all enabled modules
await moduleLoader.loadAll();

// Check if module is loaded
if (moduleLoader.isModuleLoaded('medication')) {
  const medicationService = moduleLoader.getModule('medication');
  // Use the service
}

// Get loading report
const report = moduleLoader.getReport();
console.log(`Loaded: ${report.loaded}/${report.total}`);
```

### Conditional Service Exports

```typescript
import { conditionalService } from './services/moduleLoader';
import { medicationService } from './services/medication';

// Only export if enabled
export const medication = conditionalService('medication', medicationService);

// Usage
if (medication) {
  await medication.addMedication(...);
}
```

---

## Best Practices

### 1. Start with a Preset

Choose the preset closest to your needs:
- **Minimal**: Simple demos or prototypes
- **Patient App**: Patient-facing applications
- **Provider App**: Provider dashboards
- **Researcher App**: Research and analytics

### 2. Enable Dependencies

Always enable required dependencies. The validator will warn you if dependencies are missing.

### 3. Test Your Configuration

```bash
npm run test:integration
```

This will verify all enabled modules work correctly.

### 4. Monitor Bundle Size

Check your bundle size after configuration changes:

```bash
npm run build
npm run preview
```

### 5. Document Custom Configurations

If creating custom configurations, document:
- Why certain modules are enabled/disabled
- Which features are available
- Any limitations

### 6. Use Feature Flags

Combine module configuration with feature flags for runtime control:

```typescript
// modules.config.ts - Build-time configuration
export const ACTIVE_MODULE_CONFIG = {
  llm: true,  // Include in bundle
};

// config.ts - Runtime feature flags
export const config = {
  features: {
    enableAI: false,  // Disable at runtime
  },
};
```

---

## Bundle Size Impact

Estimated module sizes (gzipped):

| Module | Size | Impact |
|--------|------|--------|
| speziKit | ~8 KB | Required |
| accessGuard | ~5 KB | Low |
| bluetooth | ~12 KB | Medium |
| sensorKit | ~10 KB | Medium |
| llm | ~15 KB | Medium-High |
| dataPipeline | ~8 KB | Low |

**Total savings** by disabling unused modules: **50-200 KB** depending on configuration.

---

## Migration Guide

### From Full Configuration to Minimal

1. Identify which features you actually use
2. Start with MINIMAL_CONFIG
3. Add only necessary modules
4. Test thoroughly
5. Monitor bundle size

### Example Migration

```typescript
// Before: Everything enabled (heavy bundle)
const config = DEFAULT_MODULE_CONFIG;

// After: Only what you need (lighter bundle)
const config = {
  ...MINIMAL_CONFIG,
  medication: true,     // Add medication feature
  notifications: true,  // Add notifications for medication
  scheduler: true,      // Required by medication
};
```

---

## Troubleshooting

### "Module X requires Module Y"

**Problem**: Missing dependency

**Solution**: Enable the required module or disable the dependent module

```typescript
// Error: medication requires scheduler
medication: true,
scheduler: false,  // ❌ Missing dependency

// Fix
medication: true,
scheduler: true,   // ✅ Dependency satisfied
```

### "Module failed to load"

**Problem**: Import error or initialization failure

**Solution**: Check browser console for detailed error, verify module configuration

### Bundle size not decreasing

**Problem**: Tree-shaking not working

**Solution**:
1. Ensure you're using production build: `npm run build`
2. Check that disabled modules aren't imported elsewhere
3. Use dynamic imports for optional features

---

## Examples

### Complete Patient App

```typescript
export const MY_PATIENT_APP: ModuleConfig = {
  // Core
  speziKit: true,
  accessGuard: true,
  networking: true,

  // Storage
  storage: true,
  scheduler: true,
  notifications: true,

  // Devices (for wearables)
  devices: true,
  bluetooth: true,
  location: false,
  sensorKit: true,

  // Healthcare
  fhir: true,
  fhirAdapters: true,
  healthData: true,
  questionnaire: true,

  // Patient features
  consent: true,
  medication: true,
  chat: true,

  // Not needed
  study: false,
  llm: false,
  dataPipeline: false,
  speech: false,

  // UI
  speziViews: true,
  license: true,
};
```

---

## Support

For questions or issues:
- Check the [Integration Tests](./src/tests/integration.test.ts)
- Review [Module Dependencies](./src/config/modules.config.ts)
- Run validation: `npm run test:imports`

---

## License

See [LICENSE](./LICENSE) file for details.
