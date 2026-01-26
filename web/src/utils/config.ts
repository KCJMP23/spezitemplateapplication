import { AppConfig, FeatureFlags, FirebaseConfig, FHIRConfig } from '@/types';

// Load configuration from environment variables
export function loadConfig(): AppConfig {
  const firebaseConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  const useEmulator =
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' ||
    import.meta.env.DEV;

  if (useEmulator) {
    firebaseConfig.useEmulator = true;
    firebaseConfig.emulatorConfig = {
      authURL: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://localhost:9099',
      firestoreHost: import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080',
      storageHost: import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199',
    };
  }

  const fhirConfig: FHIRConfig = {
    version: import.meta.env.VITE_FHIR_VERSION || '4.0.1',
    serverURL: import.meta.env.VITE_FHIR_SERVER_URL,
  };

  const featureFlags: FeatureFlags = {
    skipOnboarding: import.meta.env.VITE_SKIP_ONBOARDING === 'true',
    showOnboarding: import.meta.env.VITE_SHOW_ONBOARDING !== 'false',
    disableFirebase: import.meta.env.VITE_DISABLE_FIREBASE === 'true',
    useFirebaseEmulator: useEmulator,
    setupTestAccount: import.meta.env.VITE_ENABLE_TEST_ACCOUNT === 'true' && import.meta.env.DEV,
    enableMultiRole: import.meta.env.VITE_ENABLE_MULTI_ROLE !== 'false',
    hipaaMode: import.meta.env.VITE_HIPAA_MODE !== 'false',
    auditLogging: import.meta.env.VITE_AUDIT_LOGGING !== 'false',
  };

  return {
    name: import.meta.env.VITE_APP_NAME || 'Spezi Health',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.VITE_APP_ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
    firebase: firebaseConfig,
    fhir: fhirConfig,
    features: featureFlags,
  };
}

export const config = loadConfig();

// Validate critical configuration
export function validateConfig(cfg: AppConfig): void {
  if (!cfg.features.disableFirebase) {
    if (!cfg.firebase.apiKey) {
      throw new Error('Firebase API key is required. Set VITE_FIREBASE_API_KEY in .env');
    }
    if (!cfg.firebase.projectId) {
      throw new Error('Firebase project ID is required. Set VITE_FIREBASE_PROJECT_ID in .env');
    }
  }

  // Healthcare compliance checks
  if (cfg.environment === 'production') {
    if (!cfg.features.hipaaMode) {
      console.warn('WARNING: HIPAA mode is disabled in production!');
    }
    if (!cfg.features.auditLogging) {
      console.warn('WARNING: Audit logging is disabled in production!');
    }
    if (cfg.features.setupTestAccount) {
      throw new Error('Test account cannot be enabled in production!');
    }
    if (cfg.features.useFirebaseEmulator) {
      throw new Error('Firebase emulator cannot be used in production!');
    }
  }
}

// Initialize and validate configuration
validateConfig(config);

export default config;
