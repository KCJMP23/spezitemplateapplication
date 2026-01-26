import { ScheduledTask, RecurrenceRule } from '@/types';
import firebaseService from './firebase';
import notificationService from './notification';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { generateUUID } from '@/utils/helpers';

/**
 * INTELLIC x Precognitive Health Module
 * INTELLIC Scheduler Module
 *
 * Migrates iOS SpeziScheduler functionality to React/Web:
 * - Task scheduling with recurrence
 * - Background task execution
 * - Notification integration
 * - Task completion tracking
 */
class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Start the scheduler
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;

    // Check for due tasks every minute
    this.intervalId = setInterval(() => {
      this.checkDueTasks();
    }, 60000); // 60 seconds

    logger.info('Scheduler started');
  }

  // Stop the scheduler
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  // Check for due tasks and send notifications
  private async checkDueTasks(): Promise<void> {
    try {
      // This would query all users' tasks in a real implementation
      // For now, we'll skip the check since we don't have a global task query
      logger.debug('Checking for due tasks...');
    } catch (error) {
      logger.error('Failed to check due tasks', error);
    }
  }

  // Schedule a new task
  async scheduleTask(
    userId: string,
    task: Omit<ScheduledTask, 'id'>
  ): Promise<ScheduledTask> {
    try {
      const newTask: ScheduledTask = {
        ...task,
        id: generateUUID(),
        userId,
      };

      // Save to Firestore
      await firebaseService.setDocument(
        `users/${userId}/tasks`,
        newTask.id,
        newTask
      );

      // Schedule notification if task is in the future
      if (new Date(newTask.scheduledFor) > new Date()) {
        await this.scheduleNotification(newTask);
      }

      // Handle recurrence
      if (newTask.recurrence) {
        await this.scheduleRecurringTasks(userId, newTask);
      }

      await auditService.log(
        userId,
        'create',
        'user',
        newTask.id,
        {
          taskType: newTask.taskType,
          scheduledFor: newTask.scheduledFor,
          recurrence: newTask.recurrence,
        }
      );

      logger.info('Task scheduled', { userId, taskId: newTask.id });

      return newTask;
    } catch (error) {
      logger.error('Failed to schedule task', error);
      throw error;
    }
  }

  // Schedule notification for a task
  private async scheduleNotification(task: ScheduledTask): Promise<void> {
    try {
      const scheduledDate = new Date(task.scheduledFor);
      const now = new Date();

      if (scheduledDate <= now) {
        return; // Don't schedule notifications for past tasks
      }

      await notificationService.scheduleNotification({
        title: task.title,
        body: task.description || 'You have a scheduled task',
        scheduledFor: scheduledDate,
        data: {
          taskId: task.id,
          taskType: task.taskType,
        },
      });

      logger.debug('Notification scheduled for task', { taskId: task.id });
    } catch (error) {
      logger.error('Failed to schedule notification', error);
    }
  }

  // Schedule recurring tasks
  private async scheduleRecurringTasks(
    userId: string,
    baseTask: ScheduledTask
  ): Promise<void> {
    if (!baseTask.recurrence) return;

    try {
      const recurrence = baseTask.recurrence;
      const instances = this.calculateRecurrenceInstances(
        new Date(baseTask.scheduledFor),
        recurrence,
        10 // Generate next 10 instances
      );

      for (const scheduledFor of instances) {
        const recurringTask: Omit<ScheduledTask, 'id'> = {
          ...baseTask,
          scheduledFor,
          metadata: {
            ...baseTask.metadata,
            isRecurring: true,
            parentTaskId: baseTask.id,
          },
        };

        // Don't set recurrence on individual instances
        delete recurringTask.recurrence;

        await this.scheduleTask(userId, recurringTask);
      }

      logger.info('Recurring tasks scheduled', {
        userId,
        baseTaskId: baseTask.id,
        instanceCount: instances.length,
      });
    } catch (error) {
      logger.error('Failed to schedule recurring tasks', error);
    }
  }

  // Calculate recurrence instances
  private calculateRecurrenceInstances(
    startDate: Date,
    recurrence: RecurrenceRule,
    maxInstances: number = 10
  ): Date[] {
    const instances: Date[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < maxInstances; i++) {
      currentDate = this.getNextOccurrence(currentDate, recurrence);

      // Stop if we've reached the end date
      if (recurrence.endDate && currentDate > new Date(recurrence.endDate)) {
        break;
      }

      // Stop if we've reached the max occurrences
      if (recurrence.occurrences && i >= recurrence.occurrences) {
        break;
      }

      instances.push(new Date(currentDate));
    }

    return instances;
  }

  // Get next occurrence based on recurrence rule
  private getNextOccurrence(date: Date, recurrence: RecurrenceRule): Date {
    const next = new Date(date);

    switch (recurrence.frequency) {
      case 'daily':
        next.setDate(next.getDate() + recurrence.interval);
        break;

      case 'weekly':
        next.setDate(next.getDate() + 7 * recurrence.interval);

        // Handle specific days of week
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          const currentDay = next.getDay();
          const targetDays = recurrence.daysOfWeek.sort((a, b) => a - b);

          // Find next valid day
          let daysToAdd = 0;
          for (const day of targetDays) {
            if (day > currentDay) {
              daysToAdd = day - currentDay;
              break;
            }
          }

          if (daysToAdd === 0) {
            // Wrap to next week
            daysToAdd = 7 - currentDay + targetDays[0];
          }

          next.setDate(next.getDate() + daysToAdd);
        }
        break;

      case 'monthly':
        next.setMonth(next.getMonth() + recurrence.interval);
        break;

      case 'yearly':
        next.setFullYear(next.getFullYear() + recurrence.interval);
        break;
    }

    return next;
  }

  // Get user's tasks
  async getUserTasks(
    userId: string,
    status?: ScheduledTask['status']
  ): Promise<ScheduledTask[]> {
    try {
      let tasks = await firebaseService.queryDocuments<ScheduledTask>(
        `users/${userId}/tasks`
      );

      if (status) {
        tasks = tasks.filter((task) => task.status === status);
      }

      // Sort by scheduled date
      tasks.sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
      );

      return tasks;
    } catch (error) {
      logger.error('Failed to get user tasks', error);
      return [];
    }
  }

  // Update task
  async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<ScheduledTask>
  ): Promise<void> {
    try {
      await firebaseService.updateDocument(
        `users/${userId}/tasks`,
        taskId,
        updates
      );

      await auditService.log(
        userId,
        'update',
        'user',
        taskId,
        { updates }
      );

      logger.info('Task updated', { userId, taskId });
    } catch (error) {
      logger.error('Failed to update task', error);
      throw error;
    }
  }

  // Complete task
  async completeTask(userId: string, taskId: string): Promise<void> {
    try {
      await this.updateTask(userId, taskId, {
        status: 'completed',
        completedAt: new Date(),
      });

      logger.info('Task completed', { userId, taskId });
    } catch (error) {
      logger.error('Failed to complete task', error);
      throw error;
    }
  }

  // Cancel task
  async cancelTask(userId: string, taskId: string): Promise<void> {
    try {
      await this.updateTask(userId, taskId, {
        status: 'cancelled',
      });

      logger.info('Task cancelled', { userId, taskId });
    } catch (error) {
      logger.error('Failed to cancel task', error);
      throw error;
    }
  }

  // Delete task
  async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      await firebaseService.deleteDocument(`users/${userId}/tasks`, taskId);

      await auditService.log(userId, 'delete', 'user', taskId);

      logger.info('Task deleted', { userId, taskId });
    } catch (error) {
      logger.error('Failed to delete task', error);
      throw error;
    }
  }

  // Get upcoming tasks (next 7 days)
  async getUpcomingTasks(userId: string, days: number = 7): Promise<ScheduledTask[]> {
    try {
      const tasks = await this.getUserTasks(userId);
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return tasks.filter((task) => {
        const taskDate = new Date(task.scheduledFor);
        return (
          taskDate >= now &&
          taskDate <= futureDate &&
          task.status !== 'completed' &&
          task.status !== 'cancelled'
        );
      });
    } catch (error) {
      logger.error('Failed to get upcoming tasks', error);
      return [];
    }
  }

  // Get overdue tasks
  async getOverdueTasks(userId: string): Promise<ScheduledTask[]> {
    try {
      const tasks = await this.getUserTasks(userId);
      const now = new Date();

      return tasks.filter((task) => {
        const taskDate = new Date(task.scheduledFor);
        return (
          taskDate < now &&
          task.status === 'pending' &&
          !task.completedAt
        );
      });
    } catch (error) {
      logger.error('Failed to get overdue tasks', error);
      return [];
    }
  }

  // Reschedule task
  async rescheduleTask(
    userId: string,
    taskId: string,
    newDate: Date
  ): Promise<void> {
    try {
      await this.updateTask(userId, taskId, {
        scheduledFor: newDate,
      });

      // Get updated task
      const tasks = await firebaseService.queryDocuments<ScheduledTask>(
        `users/${userId}/tasks`
      );
      const task = tasks.find((t) => t.id === taskId);

      if (task) {
        // Reschedule notification
        await this.scheduleNotification(task);
      }

      logger.info('Task rescheduled', { userId, taskId, newDate });
    } catch (error) {
      logger.error('Failed to reschedule task', error);
      throw error;
    }
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
