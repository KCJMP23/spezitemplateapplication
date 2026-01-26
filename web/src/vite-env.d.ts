/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase Configuration
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  // Firebase Emulator
  readonly VITE_USE_FIREBASE_EMULATOR: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_URL: string;
  readonly VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: string;
  readonly VITE_FIREBASE_STORAGE_EMULATOR_HOST: string;

  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENVIRONMENT: string;

  // Feature Flags
  readonly VITE_SKIP_ONBOARDING: string;
  readonly VITE_SHOW_ONBOARDING: string;
  readonly VITE_ENABLE_TEST_ACCOUNT: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_DISABLE_FIREBASE: string;
  readonly VITE_ENABLE_MULTI_ROLE: string;

  // User Role Configuration
  readonly VITE_DEFAULT_USER_ROLE: string;

  // FHIR Configuration
  readonly VITE_FHIR_VERSION: string;
  readonly VITE_FHIR_SERVER_URL: string;

  // Healthcare Compliance
  readonly VITE_HIPAA_MODE: string;
  readonly VITE_AUDIT_LOGGING: string;
  readonly VITE_DATA_RETENTION_DAYS: string;

  // PWA Configuration
  readonly VITE_PWA_OFFLINE_MODE: string;
  readonly VITE_PWA_BACKGROUND_SYNC: string;

  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
