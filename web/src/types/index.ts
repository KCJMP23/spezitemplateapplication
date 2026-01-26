// Core application types

export type UserRole = 'patient' | 'provider' | 'researcher' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  primaryRole: UserRole;
  phoneNumber?: string;
  photoURL?: string;
  dateOfBirth?: Date;
  genderIdentity?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  consentedAt?: Date;
  consentVersion?: string;
}

export interface FeatureFlags {
  skipOnboarding: boolean;
  showOnboarding: boolean;
  disableFirebase: boolean;
  useFirebaseEmulator: boolean;
  setupTestAccount: boolean;
  enableMultiRole: boolean;
  hipaaMode: boolean;
  auditLogging: boolean;
}

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  firebase: FirebaseConfig;
  fhir: FHIRConfig;
  features: FeatureFlags;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulator?: boolean;
  emulatorConfig?: {
    authURL: string;
    firestoreHost: string;
    storageHost: string;
  };
}

export interface FHIRConfig {
  version: string;
  serverURL?: string;
}

export interface Contact {
  id: string;
  name: string;
  title?: string;
  organization: string;
  description?: string;
  address?: Address;
  phone?: ContactPoint[];
  email?: ContactPoint[];
  website?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactPoint {
  system: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms';
  value: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface ScheduledTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  taskType: 'questionnaire' | 'assessment' | 'reminder' | 'data_collection';
  status: 'pending' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  scheduledFor: Date;
  completedAt?: Date;
  dueDate?: Date;
  recurrence?: RecurrenceRule;
  metadata?: Record<string, any>;
  questionnaireId?: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  occurrences?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'task' | 'reminder' | 'alert' | 'message';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  actionURL?: string;
  data?: Record<string, any>;
}

export interface HealthData {
  id: string;
  userId: string;
  type: HealthDataType;
  value: number;
  unit: string;
  sourceDevice?: string;
  sourceApp?: string;
  recordedAt: Date;
  uploadedAt: Date;
  metadata?: Record<string, any>;
  fhirResource?: any; // FHIR Observation resource
}

export type HealthDataType =
  | 'steps'
  | 'heart_rate'
  | 'blood_pressure'
  | 'blood_glucose'
  | 'weight'
  | 'height'
  | 'temperature'
  | 'oxygen_saturation'
  | 'sleep'
  | 'activity'
  | 'nutrition';

export interface ConsentDocument {
  id: string;
  userId: string;
  version: string;
  title: string;
  content: string; // Markdown content
  consentedAt: Date;
  signature: string; // Base64 signature image
  ipAddress?: string;
  userAgent?: string;
  pdfURL?: string; // Firebase Storage URL
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

// Module system types
export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  requiredRoles: UserRole[];
  config?: Record<string, any>;
}

export interface ModuleRegistry {
  [key: string]: Module;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 'AUTH_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', details?: any) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
  }
}
