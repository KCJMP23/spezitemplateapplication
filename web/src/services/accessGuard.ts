/**
 * SpeziAccessGuard React Migration
 *
 * Access control and permissions management:
 * - Role-based access control (RBAC)
 * - Permission checks
 * - Resource-level access
 * - Conditional feature access
 * - HIPAA compliance checks
 */

import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { User } from '@/types';

// ===== Permission Types =====

export type Permission =
  | 'view:health_data'
  | 'edit:health_data'
  | 'delete:health_data'
  | 'view:patient_list'
  | 'edit:patient_list'
  | 'view:study_data'
  | 'edit:study_data'
  | 'manage:users'
  | 'manage:settings'
  | 'view:questionnaires'
  | 'submit:questionnaires'
  | 'view:consent'
  | 'manage:consent'
  | 'view:medications'
  | 'edit:medications'
  | 'view:chat'
  | 'send:messages'
  | 'export:data'
  | 'delete:account';

export type Role = 'patient' | 'provider' | 'researcher' | 'admin';

// ===== Role Permission Mapping =====

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  patient: [
    'view:health_data',
    'edit:health_data',
    'view:questionnaires',
    'submit:questionnaires',
    'view:consent',
    'view:medications',
    'edit:medications',
    'view:chat',
    'send:messages',
    'export:data',
    'delete:account',
  ],
  provider: [
    'view:health_data',
    'view:patient_list',
    'edit:patient_list',
    'view:questionnaires',
    'view:consent',
    'view:medications',
    'edit:medications',
    'view:chat',
    'send:messages',
    'export:data',
  ],
  researcher: [
    'view:study_data',
    'edit:study_data',
    'view:patient_list',
    'view:questionnaires',
    'export:data',
  ],
  admin: [
    'view:health_data',
    'edit:health_data',
    'delete:health_data',
    'view:patient_list',
    'edit:patient_list',
    'view:study_data',
    'edit:study_data',
    'manage:users',
    'manage:settings',
    'view:questionnaires',
    'submit:questionnaires',
    'view:consent',
    'manage:consent',
    'view:medications',
    'edit:medications',
    'view:chat',
    'send:messages',
    'export:data',
    'delete:account',
  ],
};

// ===== Access Guard Service =====

export interface AccessContext {
  user: User;
  resourceOwnerId?: string;
  resourceType?: string;
  environment?: string;
}

export interface AccessResult {
  granted: boolean;
  reason?: string;
}

export class AccessGuardService {
  /**
   * Check if user has permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    // Admin has all permissions
    if (user.roles.includes('admin')) {
      return true;
    }

    // Check each role
    for (const role of user.roles) {
      const rolePermissions = ROLE_PERMISSIONS[role as Role] || [];
      if (rolePermissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has role
   */
  hasRole(user: User, role: Role): boolean {
    return user.roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: User, roles: Role[]): boolean {
    return roles.some((role) => user.roles.includes(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(user: User, roles: Role[]): boolean {
    return roles.every((role) => user.roles.includes(role));
  }

  /**
   * Check if user can access resource
   */
  async canAccessResource(context: AccessContext, permission: Permission): Promise<AccessResult> {
    const { user, resourceOwnerId } = context;

    // Check basic permission
    if (!this.hasPermission(user, permission)) {
      await auditService.logAccessDenied(user.id, permission, 'Insufficient permissions');
      return {
        granted: false,
        reason: 'Insufficient permissions',
      };
    }

    // For patient role, check if accessing own data
    if (user.primaryRole === 'patient' && resourceOwnerId) {
      if (user.id !== resourceOwnerId) {
        await auditService.logAccessDenied(
          user.id,
          permission,
          'Cannot access another patient\'s data'
        );
        return {
          granted: false,
          reason: 'Cannot access another patient\'s data',
        };
      }
    }

    // Log successful access
    await auditService.logDataAccess(user.id, context.resourceType || 'unknown', resourceOwnerId);

    return {
      granted: true,
    };
  }

  /**
   * Check if user has consented
   */
  async hasValidConsent(userId: string): Promise<boolean> {
    try {
      // Check if user has signed consent in Firestore
      const consentDocs = await firebaseService.queryDocuments<any>(
        `users/${userId}/consents`,
        [{ field: 'status', operator: '==', value: 'signed' }]
      );

      // Check if there's at least one valid signed consent
      const hasValidConsent = consentDocs.some((consent) => {
        const signedDate = consent.signedAt?.toDate?.() || new Date(consent.signedAt);
        const isRecent = Date.now() - signedDate.getTime() < 365 * 24 * 60 * 60 * 1000; // Within 1 year
        return consent.status === 'signed' && isRecent;
      });

      logger.debug('Checking consent status', { userId, hasValidConsent });
      return hasValidConsent;
    } catch (error) {
      logger.error('Error checking consent', error);
      return false;
    }
  }

  /**
   * Require permission with automatic logging
   */
  async requirePermission(
    user: User,
    permission: Permission,
    resourceOwnerId?: string
  ): Promise<void> {
    const result = await this.canAccessResource(
      { user, resourceOwnerId },
      permission
    );

    if (!result.granted) {
      throw new AccessDeniedError(result.reason || 'Access denied');
    }
  }

  /**
   * Require role with automatic logging
   */
  requireRole(user: User, role: Role): void {
    if (!this.hasRole(user, role)) {
      throw new AccessDeniedError(`Required role: ${role}`);
    }
  }

  /**
   * Check feature flag access
   */
  canAccessFeature(user: User, feature: string): boolean {
    // Feature flags can be role-based or user-specific
    const betaFeatures = ['ai_assistant', 'advanced_analytics', 'llm_chat'];

    // Admin and researchers get beta features
    if (betaFeatures.includes(feature)) {
      return this.hasAnyRole(user, ['admin', 'researcher']);
    }

    // Default: all features available
    return true;
  }

  /**
   * Get all permissions for user
   */
  getUserPermissions(user: User): Permission[] {
    const permissions = new Set<Permission>();

    for (const role of user.roles) {
      const rolePermissions = ROLE_PERMISSIONS[role as Role] || [];
      rolePermissions.forEach((p) => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Check HIPAA compliance requirements
   */
  async checkHIPAACompliance(context: AccessContext): Promise<AccessResult> {
    const { user } = context;

    // Check if user has valid consent
    const hasConsent = await this.hasValidConsent(user.id);
    if (!hasConsent) {
      return {
        granted: false,
        reason: 'Valid consent required for HIPAA compliance',
      };
    }

    // Check authentication freshness (e.g., require re-auth after 30 min for PHI access)
    // This would be implemented based on session management

    return {
      granted: true,
    };
  }

  /**
   * Validate data sharing permissions
   */
  canShareData(user: User, recipientRole: Role, dataType: string): boolean {
    // Patient can share with providers and researchers
    if (user.primaryRole === 'patient') {
      return ['provider', 'researcher'].includes(recipientRole);
    }

    // Providers can share with other providers and researchers (with consent)
    if (user.primaryRole === 'provider') {
      return ['provider', 'researcher'].includes(recipientRole);
    }

    // Researchers can share aggregated data only
    if (user.primaryRole === 'researcher') {
      return dataType === 'aggregated' && recipientRole === 'researcher';
    }

    return false;
  }
}

// ===== Access Denied Error =====

export class AccessDeniedError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

// ===== Resource Access Policy =====

export interface ResourcePolicy {
  resource: string;
  action: Permission;
  condition?: (context: AccessContext) => boolean | Promise<boolean>;
}

export class PolicyEngine {
  private policies: ResourcePolicy[] = [];

  addPolicy(policy: ResourcePolicy): void {
    this.policies.push(policy);
  }

  async evaluate(
    resource: string,
    action: Permission,
    context: AccessContext
  ): Promise<AccessResult> {
    const matchingPolicies = this.policies.filter(
      (p) => p.resource === resource && p.action === action
    );

    if (matchingPolicies.length === 0) {
      return { granted: false, reason: 'No matching policy found' };
    }

    for (const policy of matchingPolicies) {
      if (policy.condition) {
        const conditionMet = await policy.condition(context);
        if (!conditionMet) {
          return { granted: false, reason: 'Policy condition not met' };
        }
      }
    }

    return { granted: true };
  }

  clearPolicies(): void {
    this.policies = [];
  }
}

// ===== Export =====

export const accessGuardService = new AccessGuardService();
export const policyEngine = new PolicyEngine();

export default accessGuardService;
