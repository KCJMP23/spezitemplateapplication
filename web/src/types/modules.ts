import { UserRole } from './index';

// Module system for role-based functionality

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  enabled: boolean;
  requiredRoles: UserRole[];
  optionalRoles?: UserRole[];
  config?: ModuleConfig;
  routes?: ModuleRoute[];
  permissions?: string[];
}

export interface ModuleConfig {
  [key: string]: any;
}

export interface ModuleRoute {
  path: string;
  name: string;
  component: string;
  requiresAuth: boolean;
  requiredRoles?: UserRole[];
}

// Patient Module Types
export interface PatientModuleConfig extends ModuleConfig {
  enableHealthDataCollection: boolean;
  enableQuestionnaires: boolean;
  enableAppointments: boolean;
  enableMessaging: boolean;
  healthDataTypes: string[];
  questionnaireFrequency?: 'daily' | 'weekly' | 'monthly';
}

// Provider Module Types
export interface ProviderModuleConfig extends ModuleConfig {
  enablePatientManagement: boolean;
  enableDataReview: boolean;
  enableMessaging: boolean;
  enableReports: boolean;
  maxPatients?: number;
  specialties?: string[];
}

// Researcher Module Types
export interface ResearcherModuleConfig extends ModuleConfig {
  enableDataAnalysis: boolean;
  enableStudyManagement: boolean;
  enableExports: boolean;
  enableAggregateReports: boolean;
  studyId?: string;
  cohorts?: string[];
  dataAccessLevel: 'aggregate' | 'de-identified' | 'identified';
}

// Module Registry
export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  // Patient Modules
  PATIENT_HEALTH_DATA: {
    id: 'patient-health-data',
    name: 'Health Data Collection',
    description: 'Track and monitor health data from wearables and manual entry',
    icon: 'MonitorHeart',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['patient'],
    routes: [
      {
        path: '/health-data',
        name: 'Health Data',
        component: 'HealthDataView',
        requiresAuth: true,
        requiredRoles: ['patient'],
      },
    ],
    permissions: ['read:health-data', 'write:health-data'],
  },
  PATIENT_QUESTIONNAIRES: {
    id: 'patient-questionnaires',
    name: 'Questionnaires',
    description: 'Complete scheduled questionnaires and assessments',
    icon: 'Assignment',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['patient'],
    routes: [
      {
        path: '/questionnaires',
        name: 'Questionnaires',
        component: 'QuestionnairesView',
        requiresAuth: true,
        requiredRoles: ['patient'],
      },
    ],
    permissions: ['read:questionnaires', 'write:questionnaire-responses'],
  },
  PATIENT_APPOINTMENTS: {
    id: 'patient-appointments',
    name: 'Appointments',
    description: 'Schedule and manage appointments with providers',
    icon: 'CalendarMonth',
    version: '1.0.0',
    enabled: false,
    requiredRoles: ['patient'],
    routes: [
      {
        path: '/appointments',
        name: 'Appointments',
        component: 'AppointmentsView',
        requiresAuth: true,
        requiredRoles: ['patient'],
      },
    ],
    permissions: ['read:appointments', 'write:appointments'],
  },

  // Provider Modules
  PROVIDER_PATIENT_MANAGEMENT: {
    id: 'provider-patient-management',
    name: 'Patient Management',
    description: 'View and manage patient roster and care plans',
    icon: 'People',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['provider'],
    routes: [
      {
        path: '/patients',
        name: 'Patients',
        component: 'PatientManagementView',
        requiresAuth: true,
        requiredRoles: ['provider'],
      },
    ],
    permissions: ['read:patients', 'write:care-plans'],
  },
  PROVIDER_DATA_REVIEW: {
    id: 'provider-data-review',
    name: 'Data Review',
    description: 'Review patient health data and questionnaire responses',
    icon: 'Analytics',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['provider'],
    routes: [
      {
        path: '/review',
        name: 'Data Review',
        component: 'DataReviewView',
        requiresAuth: true,
        requiredRoles: ['provider'],
      },
    ],
    permissions: ['read:patient-data'],
  },

  // Researcher Modules
  RESEARCHER_STUDY_MANAGEMENT: {
    id: 'researcher-study-management',
    name: 'Study Management',
    description: 'Manage research studies and participant enrollment',
    icon: 'Science',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['researcher'],
    routes: [
      {
        path: '/studies',
        name: 'Studies',
        component: 'StudyManagementView',
        requiresAuth: true,
        requiredRoles: ['researcher'],
      },
    ],
    permissions: ['read:studies', 'write:studies'],
  },
  RESEARCHER_DATA_ANALYSIS: {
    id: 'researcher-data-analysis',
    name: 'Data Analysis',
    description: 'Analyze aggregate and de-identified research data',
    icon: 'QueryStats',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['researcher'],
    routes: [
      {
        path: '/analysis',
        name: 'Analysis',
        component: 'DataAnalysisView',
        requiresAuth: true,
        requiredRoles: ['researcher'],
      },
    ],
    permissions: ['read:aggregate-data', 'read:de-identified-data'],
  },
  RESEARCHER_EXPORTS: {
    id: 'researcher-exports',
    name: 'Data Exports',
    description: 'Export research data in various formats (CSV, FHIR)',
    icon: 'Download',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['researcher'],
    routes: [
      {
        path: '/exports',
        name: 'Exports',
        component: 'DataExportsView',
        requiresAuth: true,
        requiredRoles: ['researcher'],
      },
    ],
    permissions: ['export:data'],
  },

  // Shared Modules
  MESSAGING: {
    id: 'messaging',
    name: 'Messaging',
    description: 'Secure messaging between patients, providers, and researchers',
    icon: 'Message',
    version: '1.0.0',
    enabled: false,
    requiredRoles: ['patient', 'provider', 'researcher'],
    routes: [
      {
        path: '/messages',
        name: 'Messages',
        component: 'MessagingView',
        requiresAuth: true,
      },
    ],
    permissions: ['read:messages', 'write:messages'],
  },
  CONTACTS: {
    id: 'contacts',
    name: 'Contacts',
    description: 'View study and organization contact information',
    icon: 'ContactPhone',
    version: '1.0.0',
    enabled: true,
    requiredRoles: ['patient', 'provider', 'researcher'],
    routes: [
      {
        path: '/contacts',
        name: 'Contacts',
        component: 'ContactsView',
        requiresAuth: false,
      },
    ],
    permissions: ['read:contacts'],
  },
};

// Helper functions
export function getModulesForRole(role: UserRole): ModuleDefinition[] {
  return Object.values(MODULE_DEFINITIONS).filter((module) =>
    module.requiredRoles.includes(role) || module.optionalRoles?.includes(role)
  );
}

export function getEnabledModulesForRole(role: UserRole): ModuleDefinition[] {
  return getModulesForRole(role).filter((module) => module.enabled);
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*');
}

export function getModulePermissions(moduleId: string): string[] {
  const module = MODULE_DEFINITIONS[moduleId];
  return module?.permissions || [];
}
