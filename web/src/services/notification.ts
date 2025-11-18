import { Notification as NotificationType } from '@/types';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { generateUUID } from '@/utils/helpers';
import firebaseService from './firebase';

/**
 * SpeziNotifications React Migration
 *
 * Migrates iOS SpeziNotifications functionality to React/Web:
 * - Web Push API for web notifications
 * - Capacitor Local Notifications for native apps
 * - Notification scheduling
 * - Notification permissions
 */

interface ScheduleNotificationOptions {
  title: string;
  body: string;
  scheduledFor?: Date;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  tag?: string;
}

class NotificationService {
  private permissionGranted = false;
  private isCapacitor = false;

  constructor() {
    this.checkCapacitor();
  }

  private async checkCapacitor(): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      this.isCapacitor = Capacitor.isNativePlatform();

      if (this.isCapacitor) {
        logger.info('Running on native platform - using Capacitor notifications');
      } else {
        logger.info('Running on web - using Web Push API');
      }
    } catch {
      this.isCapacitor = false;
      logger.debug('Capacitor not available');
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      if (this.isCapacitor) {
        return await this.requestCapacitorPermission();
      } else {
        return await this.requestWebPermission();
      }
    } catch (error) {
      logger.error('Failed to request notification permission', error);
      return false;
    }
  }

  // Request web notification permission
  private async requestWebPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('Notifications not supported in this browser');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permissionGranted = permission === 'granted';

    logger.info('Web notification permission:', permission);

    return this.permissionGranted;
  }

  // Request Capacitor notification permission
  private async requestCapacitorPermission(): Promise<boolean> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      const result = await LocalNotifications.requestPermissions();
      this.permissionGranted = result.display === 'granted';

      logger.info('Capacitor notification permission:', result.display);

      return this.permissionGranted;
    } catch (error) {
      logger.error('Failed to request Capacitor notification permission', error);
      return false;
    }
  }

  // Check if permission is granted
  async checkPermission(): Promise<boolean> {
    if (this.isCapacitor) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.checkPermissions();
        this.permissionGranted = result.display === 'granted';
      } catch {
        this.permissionGranted = false;
      }
    } else {
      if ('Notification' in window) {
        this.permissionGranted = Notification.permission === 'granted';
      }
    }

    return this.permissionGranted;
  }

  // Send immediate notification
  async sendNotification(
    title: string,
    body: string,
    options?: {
      icon?: string;
      badge?: string;
      data?: Record<string, any>;
      tag?: string;
    }
  ): Promise<void> {
    try {
      const hasPermission = await this.checkPermission();

      if (!hasPermission) {
        logger.warn('Notification permission not granted');
        return;
      }

      if (this.isCapacitor) {
        await this.sendCapacitorNotification(title, body, options);
      } else {
        await this.sendWebNotification(title, body, options);
      }

      logger.info('Notification sent', { title });
    } catch (error) {
      logger.error('Failed to send notification', error);
    }
  }

  // Send web notification
  private async sendWebNotification(
    title: string,
    body: string,
    options?: {
      icon?: string;
      badge?: string;
      data?: Record<string, any>;
      tag?: string;
    }
  ): Promise<void> {
    if (!('Notification' in window)) {
      logger.warn('Notifications not supported');
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: options?.icon || '/pwa-192x192.png',
      badge: options?.badge || '/pwa-64x64.png',
      data: options?.data,
      tag: options?.tag,
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  // Send Capacitor notification
  private async sendCapacitorNotification(
    title: string,
    body: string,
    options?: {
      icon?: string;
      data?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 10000),
            title,
            body,
            extra: options?.data,
            smallIcon: options?.icon,
          },
        ],
      });
    } catch (error) {
      logger.error('Failed to send Capacitor notification', error);
    }
  }

  // Schedule notification for future
  async scheduleNotification(
    options: ScheduleNotificationOptions
  ): Promise<void> {
    try {
      const hasPermission = await this.checkPermission();

      if (!hasPermission) {
        logger.warn('Notification permission not granted');
        return;
      }

      if (!options.scheduledFor) {
        // Send immediately
        await this.sendNotification(options.title, options.body, options);
        return;
      }

      if (this.isCapacitor) {
        await this.scheduleCapacitorNotification(options);
      } else {
        await this.scheduleWebNotification(options);
      }

      logger.info('Notification scheduled', {
        title: options.title,
        scheduledFor: options.scheduledFor,
      });
    } catch (error) {
      logger.error('Failed to schedule notification', error);
    }
  }

  // Schedule web notification (using setTimeout)
  private async scheduleWebNotification(
    options: ScheduleNotificationOptions
  ): Promise<void> {
    if (!options.scheduledFor) return;

    const delay = options.scheduledFor.getTime() - Date.now();

    if (delay <= 0) {
      // Past date, send immediately
      await this.sendWebNotification(options.title, options.body, options);
      return;
    }

    // Schedule for future
    setTimeout(async () => {
      await this.sendWebNotification(options.title, options.body, options);
    }, delay);

    logger.debug('Web notification scheduled with setTimeout', { delay });
  }

  // Schedule Capacitor notification
  private async scheduleCapacitorNotification(
    options: ScheduleNotificationOptions
  ): Promise<void> {
    if (!options.scheduledFor) return;

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 10000),
            title: options.title,
            body: options.body,
            schedule: {
              at: options.scheduledFor,
            },
            extra: options.data,
            smallIcon: options.icon,
          },
        ],
      });

      logger.debug('Capacitor notification scheduled');
    } catch (error) {
      logger.error('Failed to schedule Capacitor notification', error);
    }
  }

  // Save notification to Firestore for tracking
  async saveNotification(
    userId: string,
    notification: Omit<NotificationType, 'id'>
  ): Promise<NotificationType> {
    try {
      const newNotification: NotificationType = {
        ...notification,
        id: generateUUID(),
        userId,
      };

      await firebaseService.setDocument(
        `users/${userId}/notifications`,
        newNotification.id,
        newNotification
      );

      logger.info('Notification saved to Firestore', {
        userId,
        notificationId: newNotification.id,
      });

      return newNotification;
    } catch (error) {
      logger.error('Failed to save notification', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<NotificationType[]> {
    try {
      let notifications = await firebaseService.queryDocuments<NotificationType>(
        `users/${userId}/notifications`
      );

      if (unreadOnly) {
        notifications = notifications.filter((n) => !n.readAt);
      }

      // Sort by sent date (newest first)
      notifications.sort((a, b) => {
        const aDate = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const bDate = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return bDate - aDate;
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to get user notifications', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await firebaseService.updateDocument(
        `users/${userId}/notifications`,
        notificationId,
        {
          readAt: new Date(),
        }
      );

      logger.info('Notification marked as read', { userId, notificationId });
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId, true);

      for (const notification of notifications) {
        await this.markAsRead(userId, notification.id);
      }

      logger.info('All notifications marked as read', { userId });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error);
    }
  }

  // Delete notification
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      await firebaseService.deleteDocument(
        `users/${userId}/notifications`,
        notificationId
      );

      logger.info('Notification deleted', { userId, notificationId });
    } catch (error) {
      logger.error('Failed to delete notification', error);
    }
  }

  // Send task reminder
  async sendTaskReminder(
    userId: string,
    taskTitle: string,
    taskId: string,
    scheduledFor?: Date
  ): Promise<void> {
    try {
      await this.scheduleNotification({
        title: 'Task Reminder',
        body: taskTitle,
        scheduledFor,
        data: {
          type: 'task_reminder',
          taskId,
        },
      });

      // Also save to Firestore
      await this.saveNotification(userId, {
        userId,
        title: 'Task Reminder',
        body: taskTitle,
        type: 'reminder',
        priority: 'normal',
        scheduledFor,
        sentAt: scheduledFor || new Date(),
        data: {
          taskId,
        },
      });

      logger.info('Task reminder sent', { userId, taskId });
    } catch (error) {
      logger.error('Failed to send task reminder', error);
    }
  }

  // Send questionnaire reminder
  async sendQuestionnaireReminder(
    userId: string,
    questionnaireTitle: string,
    questionnaireId: string
  ): Promise<void> {
    try {
      await this.sendNotification(
        'Questionnaire Available',
        `Please complete: ${questionnaireTitle}`,
        {
          data: {
            type: 'questionnaire_reminder',
            questionnaireId,
          },
        }
      );

      await this.saveNotification(userId, {
        userId,
        title: 'Questionnaire Available',
        body: `Please complete: ${questionnaireTitle}`,
        type: 'reminder',
        priority: 'normal',
        sentAt: new Date(),
        data: {
          questionnaireId,
        },
      });

      logger.info('Questionnaire reminder sent', { userId, questionnaireId });
    } catch (error) {
      logger.error('Failed to send questionnaire reminder', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unread = await this.getUserNotifications(userId, true);
      return unread.length;
    } catch (error) {
      logger.error('Failed to get unread count', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
