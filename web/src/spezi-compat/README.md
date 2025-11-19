## Spezi Compatibility Layer

This directory contains a **Spezi-compatible architecture layer** that allows using Stanford Spezi patterns (Module, Standard, Dependency Injection) in TypeScript/React applications.

### Purpose

This layer serves three goals:

1. **Bridge to Spezi iOS** - Enables future integration with actual Spezi modules
2. **Familiar API** - Provides Spezi-style APIs for iOS developers transitioning to web
3. **Progressive Enhancement** - Works alongside existing service layer without breaking changes

---

## Three Ways to Use This Application

### Approach 1: Direct Service Layer (Current)

**Use when**: You want simple, direct access to functionality without abstractions.

```typescript
import schedulerService from '@/services/scheduler';
import { type Task } from '@/types';

// Schedule a task directly
const task: Omit<Task, 'id'> = {
  userId: 'user123',
  title: 'Daily Questionnaire',
  taskType: 'questionnaire',
  status: 'pending',
  scheduledFor: new Date(),
  recurrence: { type: 'daily', interval: 1 },
};

await schedulerService.scheduleTask('user123', task);
```

**Pros**:
- ✅ Simple and direct
- ✅ No learning curve
- ✅ Full TypeScript support

**Cons**:
- ❌ Not compatible with Spezi iOS
- ❌ Manual dependency management
- ❌ No standard coordinator pattern

---

### Approach 2: Spezi-Compatible Layer (Recommended)

**Use when**: You want Spezi-style APIs but don't need full module lifecycle management.

```typescript
import { healthcareStandard, SchedulerModule } from '@/spezi-compat';

// Initialize once in your app
await healthcareStandard.initialize([
  new SchedulerModule(),
  // ... other modules
]);

// Use Spezi-style API
const scheduler = healthcareStandard.module<SchedulerModule>('scheduler');

await scheduler.createOrUpdateTask({
  id: 'daily-questionnaire',
  title: 'Daily Questionnaire',
  userId: 'user123',
  schedule: {
    type: 'daily',
    hour: 9,
    minute: 0,
    startingAt: new Date(),
  },
  scheduleNotifications: true,
});
```

**Pros**:
- ✅ Spezi-compatible API
- ✅ Familiar to iOS developers
- ✅ Central coordinator (Standard)
- ✅ Works with existing services

**Cons**:
- ⚠️ API translation layer overhead
- ⚠️ Not all Spezi features supported

---

### Approach 3: Full Spezi Architecture (Advanced)

**Use when**: You're building new modules from scratch or need full Spezi lifecycle control.

```typescript
import { BaseModule, type ModuleMetadata, Injectable, Dependency } from '@/spezi-compat';
import type { SchedulerModule } from '@/spezi-compat';

// Create a custom Spezi module
@Injectable('my-module')
class MyResearchModule extends BaseModule {
  // Declare dependencies using @Dependency decorator
  @Dependency('scheduler')
  private scheduler!: SchedulerModule;

  metadata: ModuleMetadata = {
    id: 'my-module',
    name: 'My Research Module',
    version: '1.0.0',
    dependencies: ['scheduler'],
  };

  // Configure is called during initialization
  async configure(): Promise<void> {
    // Set up your module
    console.log('MyResearchModule configured');

    // Use dependencies
    await this.scheduler.createOrUpdateTask({
      id: 'research-task',
      title: 'Weekly Survey',
      userId: 'user123',
      schedule: { type: 'weekly', daysOfWeek: [1, 3, 5], hour: 10, minute: 0 },
    });
  }

  // Add your module-specific methods
  async enrollParticipant(userId: string): Promise<void> {
    // Implementation
  }
}

// Initialize your app with custom modules
import { HealthcareStandard } from '@/spezi-compat';

const standard = new HealthcareStandard();
await standard.initialize([
  new SchedulerModule(),
  new MyResearchModule(),
]);
```

**Pros**:
- ✅ Full Spezi architecture
- ✅ Proper dependency injection
- ✅ Module lifecycle management
- ✅ Most compatible with Spezi iOS

**Cons**:
- ⚠️ More boilerplate
- ⚠️ Steeper learning curve

---

## Architecture Components

### Module Protocol

The `Module` interface represents a software subsystem with distinct functionality.

```typescript
interface Module {
  // Called during initialization
  configure(): void | Promise<void>;

  // Optional cleanup
  teardown?(): void | Promise<void>;

  // Module metadata
  readonly metadata?: ModuleMetadata;
}
```

**Key Concepts**:
- Modules are **building blocks** of functionality
- Each module has a unique ID
- Modules can **depend on other modules**
- Modules are **initialized in dependency order**

### Standard Protocol

The `Standard` orchestrates data flow between modules.

```typescript
interface Standard {
  // Initialize all modules
  initialize(modules: Module[]): Promise<void>;

  // Access modules
  getModule<T>(moduleId: string): T | undefined;

  // Cleanup
  teardown(): Promise<void>;
}
```

**Key Concepts**:
- One Standard per application
- Coordinates data flow between modules
- Implements **constraint protocols** (HealthKit, Consent, Account)
- Manages module lifecycle

### Dependency Injection

The `@Dependency` decorator provides automatic dependency injection.

```typescript
class MyModule extends BaseModule {
  @Dependency('scheduler')
  private scheduler!: SchedulerModule;

  configure() {
    // scheduler is automatically injected
    this.scheduler.createOrUpdateTask(...);
  }
}
```

**Key Concepts**:
- Dependencies are **declared**, not created
- Automatically **resolved** during initialization
- Follows **dependency order** (topological sort)
- Circular dependencies throw errors

---

## Available Modules

### SchedulerModule

Spezi-compatible task scheduling.

```typescript
import { SchedulerModule } from '@/spezi-compat';

const scheduler = new SchedulerModule();

// Create/update task
await scheduler.createOrUpdateTask({
  id: 'task-1',
  title: 'Daily Check-in',
  userId: 'user123',
  schedule: { type: 'daily', hour: 9, minute: 0 },
  completionPolicy: 'anytime',
  scheduleNotifications: true,
  tags: ['check-in', 'daily'],
});

// Query tasks
const tasks = await scheduler.queryTasks({
  userId: 'user123',
  predicate: { status: 'pending', tags: ['daily'] },
  fetchLimit: 10,
});
```

**Wraps**: `@/services/scheduler`

---

## Creating New Spezi Modules

### Step 1: Extend BaseModule

```typescript
import { BaseModule, type ModuleMetadata, Injectable } from '@/spezi-compat';

@Injectable('my-module')
export class MyModule extends BaseModule {
  metadata: ModuleMetadata = {
    id: 'my-module',
    name: 'My Module',
    version: '1.0.0',
    description: 'Does something useful',
    dependencies: [], // List module IDs this depends on
  };

  configure(): void {
    // Initialize your module
    console.log('MyModule configured');
  }

  teardown(): void {
    // Clean up resources
    console.log('MyModule torn down');
  }
}
```

### Step 2: Add Dependencies (Optional)

```typescript
import { Dependency } from '@/spezi-compat';
import type { SchedulerModule } from '@/spezi-compat';

export class MyModule extends BaseModule {
  @Dependency('scheduler')
  private scheduler!: SchedulerModule;

  metadata: ModuleMetadata = {
    id: 'my-module',
    name: 'My Module',
    dependencies: ['scheduler'], // Declare dependency
  };

  configure(): void {
    // Use the scheduler
    this.scheduler.createOrUpdateTask(...);
  }
}
```

### Step 3: Register and Initialize

```typescript
import { healthcareStandard } from '@/spezi-compat';
import { MyModule } from './MyModule';

// Register module
await healthcareStandard.initialize([new MyModule()]);

// Use module
const myModule = healthcareStandard.module<MyModule>('my-module');
```

---

## Constraint Protocols

Constraint protocols define requirements that the Standard must implement.

### HealthKitConstraint

```typescript
interface HealthKitConstraint {
  addHealthSample(sample: any): Promise<void>;
  removeHealthSample(sampleId: string): Promise<void>;
}
```

**When to implement**: Your Standard needs to handle health data from HealthKit or other sources.

### ConsentConstraint

```typescript
interface ConsentConstraint {
  storeConsent(consent: any): Promise<void>;
}
```

**When to implement**: Your app handles digital consent forms.

### AccountNotifyConstraint

```typescript
interface AccountNotifyConstraint {
  respondToAccountEvent(event: AccountEvent): Promise<void>;
}
```

**When to implement**: Your Standard needs to react to account lifecycle events.

---

## Migration Path

### From Direct Services → Spezi-Compatible

1. **Wrap existing services** in Module classes
2. **No changes** to existing service code
3. **Add Spezi API layer** on top
4. **Use either API** - both work!

### Example: Wrapping Existing Service

```typescript
import { BaseModule, Injectable } from '@/spezi-compat';
import myExistingService from '@/services/myService';

@Injectable('my-service')
export class MyServiceModule extends BaseModule {
  metadata = {
    id: 'my-service',
    name: 'My Service Module',
  };

  configure(): void {
    // Any initialization
  }

  // Provide Spezi-style API that delegates to existing service
  async doSomething(params: any): Promise<void> {
    return myExistingService.doSomething(params);
  }
}
```

---

## Comparison with Spezi iOS

| Feature | Spezi iOS | This Implementation | Status |
|---------|-----------|---------------------|--------|
| Module Protocol | ✅ | ✅ | Complete |
| Standard Protocol | ✅ | ✅ | Complete |
| @Dependency Injection | ✅ | ✅ (via decorator) | Complete |
| @Application Access | ✅ | ✅ (via decorator) | Complete |
| Dependency Resolution | ✅ | ✅ (topological sort) | Complete |
| Circular Dep Detection | ✅ | ✅ | Complete |
| Constraint Protocols | ✅ | ✅ (HealthKit, Consent, Account) | Complete |
| SwiftData Storage | ✅ | ❌ (uses Firestore/IndexedDB) | Different |
| Versioned Storage | ✅ | ❌ (not implemented) | Planned |
| Native HealthKit | ✅ | ❌ (web limitation) | N/A |
| SwiftUI Integration | ✅ | ❌ (uses React) | N/A |

---

## Testing

```typescript
import { DependencyContainer } from '@/spezi-compat';
import { SchedulerModule } from '@/spezi-compat';

describe('Spezi Module System', () => {
  beforeEach(() => {
    // Clear dependencies between tests
    DependencyContainer.getInstance().clear();
  });

  it('should initialize modules in dependency order', async () => {
    const standard = new HealthcareStandard();
    await standard.initialize([new SchedulerModule()]);

    expect(standard.hasModule('scheduler')).toBe(true);
  });

  it('should inject dependencies', () => {
    const scheduler = new SchedulerModule();
    DependencyContainer.getInstance().register('scheduler', scheduler);

    class TestModule extends BaseModule {
      @Dependency('scheduler')
      scheduler!: SchedulerModule;
    }

    const test = new TestModule();
    expect(test.scheduler).toBe(scheduler);
  });
});
```

---

## FAQs

**Q: Do I have to use the Spezi-compatible layer?**
A: No! The direct service layer still works. Use what fits your needs.

**Q: Can I mix approaches?**
A: Yes! You can use direct services in some places and Spezi modules in others.

**Q: Is this compatible with actual Spezi iOS modules?**
A: The API signatures match where possible, but there's no runtime compatibility (different platforms/languages).

**Q: What's the performance overhead?**
A: Minimal - the compatibility layer is thin. Most work is delegated to existing services.

**Q: Should I migrate everything to Spezi modules?**
A: Only if you need Spezi-style architecture. Simple apps can stay with direct services.

---

## Resources

- [Stanford Spezi Documentation](https://swiftpackageindex.com/stanfordspezi/spezi/documentation)
- [Spezi GitHub Repository](https://github.com/StanfordSpezi/Spezi)
- [Module Guide](../../MODULE_GUIDE.md) - Complete module documentation
- [Migration Analysis](../../MIGRATION_ANALYSIS.md) - Detailed iOS vs Web comparison

---

**Status**: ✅ Production Ready

This compatibility layer is fully functional and tested. You can use it in production applications while maintaining the ability to use direct service access where preferred.
