import { AuditLog } from '@/types';
import { config } from './config';
import { logger } from './logger';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'consent'
  | 'access_denied';

export type AuditResource =
  | 'user'
  | 'health_data'
  | 'questionnaire'
  | 'consent'
  | 'patient_data'
  | 'study_data';

class AuditService {
  private enabled: boolean;

  constructor() {
    this.enabled = config.features.auditLogging;
  }

  async log(
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    if (!this.enabled) return;

    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      userId,
      action,
      resource,
      resourceId,
      timestamp: new Date(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      metadata: this.sanitizeMetadata(metadata),
      success,
      errorMessage,
    };

    try {
      // Log to console in development
      if (config.environment === 'development') {
        logger.info('Audit Log', auditLog);
      }

      // Store audit log (implement based on your needs)
      await this.storeAuditLog(auditLog);
    } catch (error) {
      logger.error('Failed to create audit log', error);
    }
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getClientIP(): Promise<string | undefined> {
    // In a real application, this would be obtained from the server
    // Client-side IP detection is not reliable
    return undefined;
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    // Remove any sensitive data from metadata
    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'token', 'signature', 'ssn'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private async storeAuditLog(auditLog: AuditLog): Promise<void> {
    // Store in Firestore (to be implemented in Firebase service)
    // For now, store in localStorage for development
    if (config.environment === 'development') {
      const logs = this.getLocalAuditLogs();
      logs.push(auditLog);
      // Keep only last 100 logs in localStorage
      const recentLogs = logs.slice(-100);
      localStorage.setItem('audit_logs', JSON.stringify(recentLogs));
    }

    // In production, send to Firestore
    // await firestore.collection('audit_logs').add(auditLog);
  }

  private getLocalAuditLogs(): AuditLog[] {
    try {
      const logs = localStorage.getItem('audit_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  // Helper methods for common audit events
  async logLogin(userId: string, success: boolean, errorMessage?: string): Promise<void> {
    await this.log(userId, 'login', 'user', userId, undefined, success, errorMessage);
  }

  async logLogout(userId: string): Promise<void> {
    await this.log(userId, 'logout', 'user', userId);
  }

  async logDataAccess(
    userId: string,
    resource: AuditResource,
    resourceId: string
  ): Promise<void> {
    await this.log(userId, 'read', resource, resourceId);
  }

  async logDataModification(
    userId: string,
    action: 'create' | 'update' | 'delete',
    resource: AuditResource,
    resourceId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(userId, action, resource, resourceId, metadata);
  }

  async logDataExport(
    userId: string,
    resource: AuditResource,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(userId, 'export', resource, undefined, metadata);
  }

  async logConsent(
    userId: string,
    consentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(userId, 'consent', 'consent', consentId, metadata);
  }

  async logAccessDenied(
    userId: string,
    resource: AuditResource,
    resourceId?: string,
    reason?: string
  ): Promise<void> {
    await this.log(
      userId,
      'access_denied',
      resource,
      resourceId,
      { reason },
      false,
      reason
    );
  }

  // Retrieve audit logs (for admin/compliance review)
  async getAuditLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    resource?: AuditResource;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    // In development, return from localStorage
    if (config.environment === 'development') {
      let logs = this.getLocalAuditLogs();

      if (filters) {
        if (filters.userId) {
          logs = logs.filter((log) => log.userId === filters.userId);
        }
        if (filters.action) {
          logs = logs.filter((log) => log.action === filters.action);
        }
        if (filters.resource) {
          logs = logs.filter((log) => log.resource === filters.resource);
        }
        if (filters.startDate) {
          logs = logs.filter((log) => new Date(log.timestamp) >= filters.startDate!);
        }
        if (filters.endDate) {
          logs = logs.filter((log) => new Date(log.timestamp) <= filters.endDate!);
        }
      }

      return logs;
    }

    // In production, query from Firestore
    // Implement Firestore query based on filters
    return [];
  }
}

export const auditService = new AuditService();
export default auditService;
