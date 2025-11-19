/**
 * Healthcare Application Standard
 *
 * This is our concrete implementation of the Spezi Standard protocol.
 * It coordinates data flow between modules and handles healthcare-specific constraints.
 *
 * Equivalent to the TemplateApplicationStandard in the iOS app.
 */

import { ApplicationStandard, type AccountEvent } from './Standard';
import { ApplicationContext } from './Dependency';
import type { Module } from './Module';
import firebaseService from '@/services/firebase';
import { logger } from '@/utils/logger';

/**
 * HealthcareStandard - Main application coordinator
 *
 * This Standard orchestrates data flow between healthcare modules,
 * handles HealthKit data, consent documents, and account lifecycle.
 */
export class HealthcareStandard extends ApplicationStandard {
  private initialized = false;

  /**
   * Initialize the standard with modules
   */
  async initialize(modules: Module[]): Promise<void> {
    if (this.initialized) {
      logger.warn('HealthcareStandard already initialized');
      return;
    }

    // Set this as the application standard
    ApplicationContext.setStandard(this);

    // Initialize all modules via parent
    await super.initialize(modules);

    this.initialized = true;
    logger.info('HealthcareStandard initialized', {
      moduleCount: this.modules.size,
    });
  }

  /**
   * Add health sample (HealthKitConstraint implementation)
   *
   * Called when new health data is collected. This coordinates
   * storing the data to Firestore in FHIR format.
   */
  async addHealthSample(sample: any): Promise<void> {
    try {
      // Store health data in FHIR format
      const userId = sample.userId || sample.subject?.reference?.split('/')[1];
      if (!userId) {
        throw new Error('No user ID found in health sample');
      }

      // Store to Firestore
      const sampleId = sample.id || `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await firebaseService.setDocument(`users/${userId}/HealthKit`, sampleId, sample);

      logger.info('Health sample added', {
        userId,
        sampleId,
        type: sample.resourceType,
      });
    } catch (error) {
      logger.error('Failed to add health sample', error);
      throw error;
    }
  }

  /**
   * Remove health sample (HealthKitConstraint implementation)
   */
  async removeHealthSample(sampleId: string): Promise<void> {
    try {
      // In a real implementation, we'd need userId - this is a limitation
      // For now, we'll log a warning
      logger.warn('Remove health sample not fully implemented', { sampleId });

      // We'd need to query for the sample first to get the userId
      // Then delete: await firebaseService.deleteDocument(`users/${userId}/HealthKit`, sampleId);
    } catch (error) {
      logger.error('Failed to remove health sample', error);
      throw error;
    }
  }

  /**
   * Store consent document (ConsentConstraint implementation)
   *
   * Stores signed consent forms to Firebase Storage
   */
  async storeConsent(consent: ConsentDocument): Promise<void> {
    try {
      const userId = consent.userId;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `consent_${timestamp}.pdf`;

      // Store to Firebase Storage
      if (consent.pdfData) {
        const storagePath = `users/${userId}/consents/${filename}`;
        const pdfBlob =
          consent.pdfData instanceof Blob
            ? consent.pdfData
            : new Uint8Array(consent.pdfData);
        await firebaseService.uploadFile(storagePath, pdfBlob, {
          contentType: 'application/pdf',
        });
      }

      // Store metadata to Firestore
      const consentId = `consent_${Date.now()}`;
      await firebaseService.setDocument(`users/${userId}/consents`, consentId, {
        signedAt: new Date(),
        status: 'signed',
        version: consent.version || '1.0',
        filename,
      });

      logger.info('Consent stored', { userId, filename });
    } catch (error) {
      logger.error('Failed to store consent', error);
      throw error;
    }
  }

  /**
   * Respond to account events (AccountNotifyConstraint implementation)
   *
   * Handles account lifecycle events like creation, updates, deletion
   */
  async respondToAccountEvent(event: AccountEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'account_created':
          logger.info('Account created', { accountId: event.accountId });
          // Could initialize user-specific data here
          break;

        case 'account_updated':
          logger.info('Account updated', { accountId: event.accountId });
          // Could sync updated account data
          break;

        case 'account_deleting':
          // Delete all user data
          await firebaseService.deleteDocument('users', event.accountId);
          logger.info('Account deleted', { accountId: event.accountId });
          break;

        default:
          logger.warn('Unknown account event type', { event });
      }
    } catch (error) {
      logger.error('Failed to respond to account event', error);
      throw error;
    }
  }

  /**
   * Handle questionnaire response
   *
   * Custom method for this application - stores FHIR QuestionnaireResponse
   */
  async addQuestionnaireResponse(response: any, userId: string): Promise<void> {
    try {
      const responseId = response.id || `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await firebaseService.setDocument(
        `users/${userId}/QuestionnaireResponse`,
        responseId,
        response
      );

      logger.info('Questionnaire response stored', { userId, responseId });
    } catch (error) {
      logger.error('Failed to store questionnaire response', error);
      throw error;
    }
  }

  /**
   * Get module by ID (convenience method)
   */
  module<T extends Module>(moduleId: string): T {
    const module = this.getModule<T>(moduleId);
    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }
    return module;
  }
}

/**
 * Consent document interface
 */
export interface ConsentDocument {
  userId: string;
  pdfData?: Blob | ArrayBuffer;
  version?: string;
  signedAt?: Date;
}

/**
 * Export singleton instance
 */
export const healthcareStandard = new HealthcareStandard();
