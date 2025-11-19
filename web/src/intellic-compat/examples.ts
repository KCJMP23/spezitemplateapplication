/**
 * Spezi Compatibility Layer - Usage Examples
 *
 * This file demonstrates all three approaches to using this application:
 * 1. Direct Service Layer
 * 2. Spezi-Compatible Layer
 * 3. Full Spezi Architecture
 *
 * Run these examples to see how each approach works.
 */

// ============================================================================
// APPROACH 1: Direct Service Layer (Current)
// ============================================================================

export async function example1_DirectServiceLayer() {
  console.log('\n=== Approach 1: Direct Service Layer ===\n');

  // Import services directly
  const schedulerService = (await import('@/services/scheduler')).default;

  const userId = 'demo-user-123';

  // Schedule a task using the direct service API
  console.log('Scheduling task via direct service...');
  await schedulerService.scheduleTask(userId, {
    userId,
    title: 'Direct Service Task',
    description: 'This was created using the direct service layer',
    taskType: 'reminder',
    status: 'pending',
    scheduledFor: new Date(),
    recurrence: {
      frequency: 'daily',
      interval: 1,
    },
  });

  // Get tasks
  const tasks = await schedulerService.getUserTasks(userId);
  console.log(`✓ Found ${tasks.length} tasks`);
  console.log('  Task:', tasks[0]?.title);

  console.log('\n✅ Approach 1 complete - Simple and direct!\n');
}

// ============================================================================
// APPROACH 2: Spezi-Compatible Layer (Recommended)
// ============================================================================

export async function example2_SpeziCompatibleLayer() {
  console.log('\n=== Approach 2: Spezi-Compatible Layer ===\n');

  // Import Spezi-compatible modules
  const { healthcareStandard, SchedulerModule } = await import('@/intellic-compat');

  // Initialize the healthcare standard with modules
  console.log('Initializing Healthcare Standard...');
  await healthcareStandard.initialize([new SchedulerModule()]);
  console.log('✓ Standard initialized');

  // Get the scheduler module
  const scheduler = healthcareStandard.module('scheduler') as InstanceType<typeof SchedulerModule>;

  // Use Spezi-style API
  console.log('Creating task via Spezi API...');
  await scheduler.createOrUpdateTask({
    id: 'intellic-task-1',
    title: 'Daily Questionnaire',
    userId: 'demo-user-123',
    instructions: 'Please complete your daily health questionnaire',
    category: {
      name: 'Health Assessment',
      type: 'questionnaire',
      icon: 'clipboard',
    },
    schedule: {
      type: 'daily',
      hour: 9,
      minute: 0,
      startingAt: new Date(),
    },
    completionPolicy: 'anytime',
    scheduleNotifications: true,
    tags: ['health', 'daily'],
  });
  console.log('✓ Task created with Spezi API');

  // Query tasks using Spezi-style predicate
  console.log('Querying tasks...');
  const tasks = await scheduler.queryTasks({
    userId: 'demo-user-123',
    predicate: {
      status: 'pending',
      tags: ['daily'],
    },
    fetchLimit: 10,
  });
  console.log(`✓ Found ${tasks.length} pending daily tasks`);

  console.log('\n✅ Approach 2 complete - Spezi-compatible!\n');
}

// ============================================================================
// APPROACH 3: Full Spezi Architecture (Advanced)
// ============================================================================

export async function example3_FullSpeziArchitecture() {
  console.log('\n=== Approach 3: Full Spezi Architecture ===\n');

  // Import Spezi core
  const { BaseModule, Injectable, HealthcareStandard, SchedulerModule } =
    await import('@/intellic-compat');

  // Import types
  type ModuleMetadata = import('@/intellic-compat').ModuleMetadata;

  // Create a custom research module
  console.log('Creating custom Spezi module...');

  @Injectable('research')
  class ResearchModule extends BaseModule {
    // Dependency injection - get scheduler dynamically
    private get scheduler(): InstanceType<typeof SchedulerModule> {
      const { DependencyContainer } = require('@/intellic-compat/Dependency');
      return DependencyContainer.getInstance().resolve('scheduler');
    }

    metadata: ModuleMetadata = {
      id: 'research',
      name: 'Research Module',
      version: '1.0.0',
      description: 'Manages research studies and participant enrollment',
      dependencies: ['scheduler'],
    };

    // Module configuration
    async configure(): Promise<void> {
      console.log('  ✓ ResearchModule configured');

      // Use the scheduler dependency
      console.log('  ✓ Scheduler dependency injected:', !!this.scheduler);
    }

    // Custom module methods
    async enrollParticipant(userId: string, studyId: string): Promise<void> {
      console.log(`  📝 Enrolling participant ${userId} in study ${studyId}`);

      // Schedule study tasks using the injected scheduler
      await this.scheduler.createOrUpdateTask({
        id: `${studyId}-baseline`,
        title: 'Baseline Assessment',
        userId,
        schedule: { type: 'once', startingAt: new Date() },
        tags: ['study', studyId, 'baseline'],
      });

      console.log('  ✓ Participant enrolled and tasks scheduled');
    }

    teardown(): void {
      console.log('  ✓ ResearchModule torn down');
    }
  }

  // Create and initialize the standard
  console.log('Initializing custom standard...');
  const standard = new HealthcareStandard();
  await standard.initialize([
    new SchedulerModule(),
    new ResearchModule(),
  ]);
  console.log('✓ Standard initialized with 2 modules');

  // Use the research module
  const research = standard.module<ResearchModule>('research');
  console.log('Enrolling participant via custom module...');
  await research.enrollParticipant('participant-456', 'study-cardiovascular');
  console.log('✓ Participant enrolled');

  // Cleanup
  console.log('Tearing down standard...');
  await standard.teardown();
  console.log('✓ Standard torn down');

  console.log('\n✅ Approach 3 complete - Full Spezi architecture!\n');
}

// ============================================================================
// MIXED APPROACH: Using All Three Together
// ============================================================================

export async function example4_MixedApproach() {
  console.log('\n=== Mixed Approach: All Three Together ===\n');

  // Initialize Spezi-compatible layer
  const { healthcareStandard, SchedulerModule } = await import('@/intellic-compat');
  await healthcareStandard.initialize([new SchedulerModule()]);

  // Also import direct services
  const notificationService = (await import('@/services/notification')).default;

  const userId = 'mixed-user-789';

  // Use Spezi for structured data
  console.log('1. Using Spezi API for task scheduling...');
  const scheduler = healthcareStandard.module('scheduler') as InstanceType<typeof SchedulerModule>;
  await scheduler.createOrUpdateTask({
    id: 'mixed-task',
    title: 'Mixed Approach Task',
    userId,
    schedule: { type: 'daily', hour: 10, minute: 0 },
  });
  console.log('  ✓ Task scheduled via Spezi');

  // Use direct service for simple operations
  console.log('2. Using direct service for notification...');
  await notificationService.sendNotification(
    'Task Scheduled',
    'Your daily task has been scheduled',
    { tag: 'task-notification' }
  );
  console.log('  ✓ Notification sent via direct service');

  // Coordination via Healthcare Standard
  console.log('3. Using Standard to coordinate...');
  await healthcareStandard.addQuestionnaireResponse(
    {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      authored: new Date().toISOString(),
    },
    userId
  );
  console.log('  ✓ Questionnaire response stored via Standard');

  console.log('\n✅ Mixed approach complete - Use what fits best!\n');
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Spezi Compatibility Layer - Complete Examples             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await example1_DirectServiceLayer();
    await example2_SpeziCompatibleLayer();
    await example3_FullSpeziArchitecture();
    await example4_MixedApproach();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ All Examples Completed Successfully!                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Key Takeaways:');
    console.log('  • Approach 1: Simple, direct - for basic needs');
    console.log('  • Approach 2: Spezi-compatible - recommended for most');
    console.log('  • Approach 3: Full architecture - for complex apps');
    console.log('  • Mixed: Use what fits - all approaches work together!\n');
  } catch (error) {
    console.error('❌ Example failed:', error);
    throw error;
  }
}

// Export for testing
if (import.meta.env.DEV) {
  console.log('Run examples with:');
  console.log('  import { runAllExamples } from "@/intellic-compat/examples"');
  console.log('  await runAllExamples()');
}
