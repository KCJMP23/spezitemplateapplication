# INTELLIC x Precognitive Health Module Configuration Wizard

An interactive wizard that helps users select and configure INTELLIC x Precognitive Health modules based on their healthcare application requirements.

## Overview

The Spezi Configuration Wizard is a step-by-step interface that guides users through configuring their healthcare application by asking questions about:

1. **Application Type** - What kind of healthcare app are you building?
2. **User Roles** - Which user types will the app support?
3. **Features** - What functionality do you need?
4. **Compliance** - What regulatory standards must you meet?
5. **Module Selection** - Which Spezi modules should be included?
6. **Review** - Final configuration summary

## Features

### Intelligent Module Recommendations

The wizard automatically recommends modules based on:
- Selected application type
- Enabled features
- Compliance requirements

For example:
- If you enable "HIPAA" compliance → Recommends `consent` and `storage` modules
- If you enable "questionnaires" feature → Recommends `questionnaire` module
- If you select "Clinical Trial" app type → Recommends `scheduler`, `questionnaire`, `consent`, `study`, and `dataExport`

### Automatic Dependency Resolution

When you enable a module that depends on others, the wizard automatically:
- Enables required dependencies
- Shows dependency information
- Prevents breaking configurations

Example:
```
Enable: wearables
Auto-enables: healthData (dependency)
```

### Configuration Persistence

- Saves configuration to local storage
- Can export configuration as JSON
- Can import previously saved configurations
- Generates TypeScript code for manual initialization

## Usage

### Basic Usage

```tsx
import IntellicConfigWizard from '@/components/IntellicConfigWizard';

function MyApp() {
  const handleComplete = (config) => {
    console.log('Configuration complete:', config);
    // Initialize modules with the configuration
  };

  return <IntellicConfigWizard onComplete={handleComplete} />;
}
```

### With Module Configurator Service

```tsx
import IntellicConfigWizard from '@/components/IntellicConfigWizard';
import moduleConfiguratorService from '@/services/moduleConfigurator';

function Setup() {
  const handleComplete = async (config) => {
    // Initialize modules based on configuration
    const results = await moduleConfiguratorService.initializeFromConfig(config);

    console.log('Initialization results:', results);
  };

  return (
    <IntellicConfigWizard
      onComplete={handleComplete}
      onCancel={() => console.log('Wizard cancelled')}
    />
  );
}
```

### In Module Setup View

The `ModuleSetupView` component provides a complete implementation with:
- Configuration persistence
- Module initialization
- Export/import functionality
- Code generation
- Result display

Access at: `/setup/modules`

## Application Types

### Clinical Trial / Research Study
**Use Case**: Recruit participants, collect data, manage study protocols

**Recommended Modules**:
- Scheduler - Task scheduling and reminders
- Questionnaire - FHIR questionnaires
- Consent - Digital consent management
- Study - Research study coordination
- Data Export - Export study data

### Patient Monitoring
**Use Case**: Track patient health data, vitals, medications

**Recommended Modules**:
- Scheduler - Medication reminders
- Health Data - Store observations
- Medication - Medication tracking
- Wearables - Device integration
- Notifications - Push notifications

### Health Data Collection
**Use Case**: Gather health metrics from wearables and manual entry

**Recommended Modules**:
- Health Data - Store health observations
- Wearables - Bluetooth device integration
- Storage - Encrypted local storage
- Data Export - Export collected data

### Custom Application
**Use Case**: Build a custom healthcare solution

**Recommended Modules**: None (you select what you need)

## Available Modules

### Core Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Scheduler | `scheduler` | Task scheduling and reminders | - |
| Notifications | `notifications` | Push and local notifications | - |
| Storage | `storage` | Encrypted local storage | - |

### Data Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Health Data | `healthData` | Store and manage health observations | - |
| Questionnaire | `questionnaire` | FHIR questionnaires and responses | - |
| Data Export | `dataExport` | Export to CSV, FHIR, etc. | - |

### Clinical Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Medication | `medication` | Medication adherence monitoring | - |

### Research Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Study | `study` | Research study coordination | - |

### Communication Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Chat | `chat` | HIPAA-compliant messaging | - |

### Integration Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Wearables | `wearables` | Connect to health devices via Bluetooth | `healthData` |

### Compliance Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Consent | `consent` | Digital consent with e-signatures | - |

### AI Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| LLM | `llm` | LLM integration for health insights | - |

### Tracking Modules

| Module | ID | Description | Dependencies |
|--------|-----|-------------|--------------|
| Location | `location` | Geolocation and geofencing | - |

## Configuration Object

The wizard produces a `WizardConfig` object:

```typescript
interface WizardConfig {
  // Application type
  appType: 'clinical_trial' | 'patient_monitoring' | 'data_collection' | 'custom';

  // User roles supported by the app
  userRoles: ('patient' | 'provider' | 'researcher')[];

  // Features enabled
  features: {
    scheduling: boolean;
    questionnaires: boolean;
    wearables: boolean;
    messaging: boolean;
    consent: boolean;
    dataExport: boolean;
    llm: boolean;
    location: boolean;
  };

  // Compliance requirements
  compliance: {
    hipaa: boolean;
    gdpr: boolean;
    fhir: boolean;
  };

  // Selected modules
  modules: ModuleConfig[];
}

interface ModuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}
```

## Module Configurator Service

The `moduleConfiguratorService` handles configuration persistence and module initialization:

### Methods

#### `initializeFromConfig(config: WizardConfig): Promise<InitializedModule[]>`
Initialize Spezi modules based on wizard configuration.

```typescript
const results = await moduleConfiguratorService.initializeFromConfig(config);
// returns: Array of InitializedModule with status
```

#### `saveConfiguration(config: WizardConfig): Promise<void>`
Save configuration to persistent storage.

#### `loadConfiguration(): Promise<WizardConfig | null>`
Load configuration from storage.

#### `generateConfigCode(config: WizardConfig): string`
Generate TypeScript code for manual initialization.

```typescript
const code = moduleConfiguratorService.generateConfigCode(config);
console.log(code);
// Output:
// import { initializeSpezi } from '@/spezi-compat';
// async function initializeApp() {
//   const config = await initializeSpezi({
//     modules: ['scheduler', 'questionnaire'],
//   });
// }
```

#### `exportConfiguration(config: WizardConfig): string`
Export configuration as JSON string.

#### `importConfiguration(json: string): WizardConfig`
Import configuration from JSON string.

## Example Workflow

### 1. User completes wizard

```typescript
const config: WizardConfig = {
  appType: 'clinical_trial',
  userRoles: ['patient', 'researcher'],
  features: {
    scheduling: true,
    questionnaires: true,
    wearables: false,
    messaging: false,
    consent: true,
    dataExport: true,
    llm: false,
    location: false,
  },
  compliance: {
    hipaa: true,
    gdpr: false,
    fhir: true,
  },
  modules: [
    { id: 'scheduler', name: 'Scheduler', enabled: true },
    { id: 'questionnaire', name: 'Questionnaire', enabled: true },
    { id: 'consent', name: 'Consent Management', enabled: true },
    { id: 'study', name: 'Study Management', enabled: true },
    { id: 'dataExport', name: 'Data Export', enabled: true },
  ],
};
```

### 2. Configuration is saved

```typescript
await moduleConfiguratorService.saveConfiguration(config);
```

### 3. Modules are initialized

```typescript
const results = await moduleConfiguratorService.initializeFromConfig(config);

// results:
// [
//   { id: 'scheduler', name: 'Scheduler', status: 'initialized' },
//   { id: 'questionnaire', name: 'Questionnaire', status: 'failed', error: 'Not implemented' },
//   // ...
// ]
```

### 4. Configuration can be exported

```typescript
// As JSON
const json = moduleConfiguratorService.exportConfiguration(config);

// As code
const code = moduleConfiguratorService.generateConfigCode(config);
```

## Integration with Spezi Compatibility Layer

The wizard integrates with the Spezi compatibility layer (`src/spezi-compat/`):

```typescript
// Wizard produces configuration
const config = { ... };

// Configurator service maps to Spezi modules
const modules = config.modules
  .filter(m => m.enabled)
  .map(m => createModuleInstance(m));

// Healthcare Standard initializes modules
await healthcareStandard.initialize(modules);
```

Currently implemented Spezi modules:
- ✅ **Scheduler** - Full implementation with Spezi-compatible API

Modules using direct service layer (not yet wrapped):
- ⏳ Questionnaire, Health Data, Wearables, Consent, Chat, etc.

## Customization

### Adding New Application Types

Edit `APP_TYPES` in `IntellicConfigWizard.tsx`:

```typescript
const APP_TYPES = [
  // ... existing types
  {
    id: 'telehealth' as const,
    name: 'Telehealth Platform',
    description: 'Virtual care and remote consultations',
    recommendedModules: ['chat', 'scheduler', 'notifications'],
  },
];
```

### Adding New Modules

Edit `AVAILABLE_MODULES` in `IntellicConfigWizard.tsx`:

```typescript
const AVAILABLE_MODULES = [
  // ... existing modules
  {
    id: 'telehealth',
    name: 'Telehealth',
    description: 'Video consultations and virtual care',
    requiredFor: ['telehealth'], // Link to feature
    category: 'communication',
    dependencies: ['chat', 'scheduler'],
  },
];
```

Then implement the module wrapper in `src/spezi-compat/modules/`.

### Adding New Features

Edit the `features` object in the wizard state:

```typescript
features: {
  // ... existing features
  telehealth: boolean;
  imaging: boolean;
  labs: boolean;
}
```

## Best Practices

1. **Always use the wizard** for initial setup rather than manual configuration
2. **Export your configuration** after setup for backup/version control
3. **Test with minimal modules** first, then add more as needed
4. **Review dependencies** when enabling/disabling modules
5. **Check initialization results** to see which modules loaded successfully

## Troubleshooting

### Module fails to initialize

**Problem**: Module shows `status: 'failed'` after initialization

**Solution**:
- Check if the module is implemented in `src/spezi-compat/modules/`
- Review the error message in the result
- Currently only `scheduler` is fully implemented

### Dependencies not auto-enabled

**Problem**: Module dependencies aren't automatically selected

**Solution**:
- Ensure the module's `dependencies` array is correctly defined in `AVAILABLE_MODULES`
- The wizard uses topological sorting to resolve dependencies

### Configuration not persisting

**Problem**: Configuration is lost after page refresh

**Solution**:
- Check browser local storage permissions
- Verify `storageService` is working correctly
- Try exporting configuration as JSON backup

## Future Enhancements

- [ ] Add module configuration parameters (e.g., scheduler interval, notification settings)
- [ ] Visual module dependency graph
- [ ] Module preview/documentation
- [ ] Configuration templates (Clinical Trial, Patient Portal, etc.)
- [ ] Module compatibility checker
- [ ] Automatic update detection for module versions
- [ ] Multi-step module setup wizards
- [ ] Integration testing after module initialization

## Related Documentation

- [Spezi Compatibility Layer README](../spezi-compat/README.md)
- [Module Implementation Guide](../spezi-compat/Module.ts)
- [Healthcare Standard](../spezi-compat/HealthcareStandard.ts)
- [Migration Analysis](../../MIGRATION_ANALYSIS.md)
