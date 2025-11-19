/**
 * Environment Setup for Tests
 *
 * Polyfills import.meta.env for Node.js environment
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Polyfill import.meta.env for Vite-style environment variables
// This is a global polyfill that will be used by all modules
const envProxy = {
    // Firebase Configuration (mock values for testing)
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || 'test-project-id',
    VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '1:123456789:web:test',

    // Firebase Emulator
    VITE_USE_FIREBASE_EMULATOR: process.env.VITE_USE_FIREBASE_EMULATOR || 'false',
    VITE_FIREBASE_AUTH_EMULATOR_URL: process.env.VITE_FIREBASE_AUTH_EMULATOR_URL || '',
    VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: process.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || '',
    VITE_FIREBASE_STORAGE_EMULATOR_HOST: process.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || '',

    // Application Configuration
    VITE_APP_NAME: process.env.VITE_APP_NAME || 'Spezi Health',
    VITE_APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',
    VITE_APP_ENVIRONMENT: process.env.VITE_APP_ENVIRONMENT || 'development',

    // Feature Flags
    VITE_SKIP_ONBOARDING: process.env.VITE_SKIP_ONBOARDING || 'false',
    VITE_SHOW_ONBOARDING: process.env.VITE_SHOW_ONBOARDING || 'true',
    VITE_ENABLE_TEST_ACCOUNT: process.env.VITE_ENABLE_TEST_ACCOUNT || 'false',
    VITE_ENABLE_ANALYTICS: process.env.VITE_ENABLE_ANALYTICS || 'false',
    VITE_DISABLE_FIREBASE: 'true', // Always disable Firebase for import tests
    VITE_ENABLE_MULTI_ROLE: process.env.VITE_ENABLE_MULTI_ROLE || 'true',

    // User Role Configuration
    VITE_DEFAULT_USER_ROLE: process.env.VITE_DEFAULT_USER_ROLE || 'patient',

    // FHIR Configuration
    VITE_FHIR_VERSION: process.env.VITE_FHIR_VERSION || '4.0.1',
    VITE_FHIR_SERVER_URL: process.env.VITE_FHIR_SERVER_URL || '',

    // Healthcare Compliance
    VITE_HIPAA_MODE: process.env.VITE_HIPAA_MODE || 'true',
    VITE_AUDIT_LOGGING: process.env.VITE_AUDIT_LOGGING || 'true',
    VITE_DATA_RETENTION_DAYS: process.env.VITE_DATA_RETENTION_DAYS || '2555',

    // PWA Configuration
    VITE_PWA_OFFLINE_MODE: process.env.VITE_PWA_OFFLINE_MODE || 'true',
    VITE_PWA_BACKGROUND_SYNC: process.env.VITE_PWA_BACKGROUND_SYNC || 'true',

    // Development mode flag
    DEV: process.env.NODE_ENV !== 'production',
    PROD: process.env.NODE_ENV === 'production',
    MODE: process.env.NODE_ENV || 'development',
};

// Set the env object on import.meta
Object.defineProperty(import.meta, 'env', {
  value: envProxy,
  writable: true,
  configurable: true,
});

console.log('✓ Environment setup complete');
