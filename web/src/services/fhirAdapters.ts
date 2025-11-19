/**
 * FHIR Adapters for Spezi
 *
 * - HealthKit to FHIR adapter
 * - FHIR to Firestore adapter
 * - SMART on FHIR integration
 * - FHIR resource validation
 */

import fhirService from './fhir';
import firebaseService from './firebase';
import { logger } from '@/utils/logger';
import { HealthData } from '@/types';
import { FHIRObservation, FHIRPatient } from '@/types/fhir';

// ===== HealthKit to FHIR Adapter =====

export class HealthKitToFHIRAdapter {
  /**
   * Convert HealthKit data to FHIR Observation
   */
  convertToFHIRObservation(healthData: HealthData, userId: string): FHIRObservation {
    return fhirService.createObservation(healthData, userId);
  }

  /**
   * Batch convert HealthKit data
   */
  async batchConvert(healthDataList: HealthData[], userId: string): Promise<FHIRObservation[]> {
    return healthDataList.map((data) => this.convertToFHIRObservation(data, userId));
  }

  /**
   * Create FHIR Bundle from HealthKit data
   */
  async createBundle(healthDataList: HealthData[], userId: string): Promise<any> {
    const observations = await this.batchConvert(healthDataList, userId);
    return fhirService.createBundle(observations);
  }
}

// ===== FHIR to Firestore Adapter =====

export class FHIRToFirestoreAdapter {
  /**
   * Save FHIR resource to Firestore
   */
  async saveFHIRResource(userId: string, resource: any): Promise<void> {
    try {
      const collection = `users/${userId}/fhirResources`;
      const docId = resource.id || `${resource.resourceType}_${Date.now()}`;

      await firebaseService.setDocument(collection, docId, {
        ...resource,
        _savedAt: new Date(),
      });

      logger.info('FHIR resource saved to Firestore', {
        resourceType: resource.resourceType,
        id: docId,
      });
    } catch (error) {
      logger.error('Failed to save FHIR resource', error);
      throw error;
    }
  }

  /**
   * Get FHIR resources from Firestore
   */
  async getFHIRResources(userId: string, resourceType?: string): Promise<any[]> {
    try {
      const resources = await firebaseService.queryDocuments<any>(
        `users/${userId}/fhirResources`
      );

      if (resourceType) {
        return resources.filter((r) => r.resourceType === resourceType);
      }

      return resources;
    } catch (error) {
      logger.error('Failed to get FHIR resources', error);
      return [];
    }
  }

  /**
   * Sync FHIR bundle to Firestore
   */
  async syncBundle(userId: string, bundle: any): Promise<void> {
    if (bundle.resourceType !== 'Bundle') {
      throw new Error('Invalid bundle');
    }

    const entries = bundle.entry || [];

    for (const entry of entries) {
      if (entry.resource) {
        await this.saveFHIRResource(userId, entry.resource);
      }
    }

    logger.info('FHIR bundle synced', { resourceCount: entries.length });
  }
}

// ===== SMART on FHIR Integration =====

export class SMARTonFHIRService {
  private clientId: string = '';
  private redirectUri: string = '';
  private scope: string = 'patient/*.read patient/*.write';
  private fhirServerUrl: string = '';

  configure(config: {
    clientId: string;
    redirectUri: string;
    fhirServerUrl: string;
    scope?: string;
  }): void {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.fhirServerUrl = config.fhirServerUrl;
    if (config.scope) {
      this.scope = config.scope;
    }
  }

  /**
   * Initiate SMART on FHIR authorization
   */
  async authorize(): Promise<void> {
    try {
      const authUrl = await this.getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (error) {
      logger.error('SMART on FHIR authorization failed', error);
      throw error;
    }
  }

  private async getAuthorizationUrl(): Promise<string> {
    // Discover authorization endpoint
    const metadataUrl = `${this.fhirServerUrl}/metadata`;
    const response = await fetch(metadataUrl);
    const metadata = await response.json();

    const authExtension = metadata.rest?.[0]?.security?.extension?.find(
      (ext: any) => ext.url === 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris'
    );

    const authorizeUrl = authExtension?.extension?.find(
      (ext: any) => ext.url === 'authorize'
    )?.valueUri;

    if (!authorizeUrl) {
      throw new Error('Authorization endpoint not found');
    }

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: Math.random().toString(36).substring(7),
      aud: this.fhirServerUrl,
    });

    return `${authorizeUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   *
   * ⚠️ SIMULATED IMPLEMENTATION - Replace with real SMART on FHIR OAuth flow
   *
   * For production, implement the full OAuth 2.0 authorization code exchange:
   *
   * ```typescript
   * async handleCallback(code: string): Promise<{ accessToken: string; patient: string }> {
   *   // Exchange authorization code for access token
   *   const tokenResponse = await httpClient.post(this.tokenEndpoint, {
   *     grant_type: 'authorization_code',
   *     code,
   *     redirect_uri: this.redirectUri,
   *     client_id: this.clientId,
   *   });
   *
   *   const { access_token, patient } = tokenResponse;
   *
   *   // Store token securely
   *   await storageService.setItem('smart_access_token', access_token);
   *   await storageService.setItem('smart_patient_id', patient);
   *
   *   return {
   *     accessToken: access_token,
   *     patient: patient,
   *   };
   * }
   * ```
   *
   * See: http://hl7.org/fhir/smart-app-launch/
   */
  async handleCallback(code: string): Promise<{
    accessToken: string;
    patient: string;
  }> {
    try {
      logger.info('Handling SMART on FHIR callback (SIMULATED)');
      logger.warn(
        'SMART on FHIR OAuth is simulated. ' +
        'Implement real token exchange for production use.'
      );

      // Simulated response - replace with real OAuth token exchange
      return {
        accessToken: code, // In reality, exchange code for access_token
        patient: 'patient-id', // In reality, extract from token response
      };
    } catch (error) {
      logger.error('Failed to handle SMART callback', error);
      throw error;
    }
  }

  /**
   * Fetch FHIR resource using SMART context
   */
  async fetchResource(accessToken: string, resourceType: string, resourceId: string): Promise<any> {
    try {
      const url = `${this.fhirServerUrl}/${resourceType}/${resourceId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch FHIR resource', error);
      throw error;
    }
  }
}

// ===== FHIR Validation =====

export class FHIRValidator {
  /**
   * Validate FHIR resource structure
   */
  validateResource(resource: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!resource.resourceType) {
      errors.push('Missing resourceType');
    }

    // Add more validation rules based on resource type
    switch (resource.resourceType) {
      case 'Observation':
        if (!resource.status) errors.push('Missing status');
        if (!resource.code) errors.push('Missing code');
        break;

      case 'Patient':
        if (!resource.name) errors.push('Missing name');
        break;

      case 'MedicationStatement':
        if (!resource.status) errors.push('Missing status');
        if (!resource.subject) errors.push('Missing subject');
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate FHIR Bundle
   */
  validateBundle(bundle: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (bundle.resourceType !== 'Bundle') {
      errors.push('Not a Bundle resource');
    }

    if (!bundle.type) {
      errors.push('Missing bundle type');
    }

    // Validate each entry
    if (bundle.entry) {
      bundle.entry.forEach((entry: any, index: number) => {
        if (entry.resource) {
          const validation = this.validateResource(entry.resource);
          if (!validation.valid) {
            errors.push(`Entry ${index}: ${validation.errors.join(', ')}`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ===== Export =====

export const healthKitToFHIRAdapter = new HealthKitToFHIRAdapter();
export const fhirToFirestoreAdapter = new FHIRToFirestoreAdapter();
export const smartOnFHIRService = new SMARTonFHIRService();
export const fhirValidator = new FHIRValidator();

export default {
  HealthKitToFHIRAdapter,
  FHIRToFirestoreAdapter,
  SMARTonFHIRService,
  FHIRValidator,
  healthKitToFHIRAdapter,
  fhirToFirestoreAdapter,
  smartOnFHIRService,
  fhirValidator,
};
