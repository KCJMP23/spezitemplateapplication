import {
  FHIRObservation,
  FHIRQuestionnaireResponse,
  FHIRPatient,
  CodeableConcept,
  Quantity,
  Reference,
  FHIR_SYSTEMS,
  HEALTH_DATA_CODES,
  OBSERVATION_CATEGORIES,
  QuestionnaireResponseItem,
} from '@/types/fhir';
import { HealthData, HealthDataType, User } from '@/types';
import { toFHIRDateTime } from '@/utils/helpers';
import { logger } from '@/utils/logger';
import { config } from '@/utils/config';

class FHIRService {
  private fhirVersion = config.fhir.version;

  // Convert health data to FHIR Observation
  createObservation(
    healthData: HealthData,
    userId: string
  ): FHIRObservation {
    const observation: FHIRObservation = {
      resourceType: 'Observation',
      id: healthData.id,
      meta: {
        versionId: '1',
        lastUpdated: toFHIRDateTime(healthData.uploadedAt),
        profile: [`http://hl7.org/fhir/StructureDefinition/vitalsigns`],
      },
      status: 'final',
      category: [this.getCategoryForDataType(healthData.type)],
      code: this.getCodeForDataType(healthData.type),
      subject: {
        reference: `Patient/${userId}`,
        type: 'Patient',
      },
      effectiveDateTime: toFHIRDateTime(healthData.recordedAt),
      issued: toFHIRDateTime(healthData.uploadedAt),
      valueQuantity: {
        value: healthData.value,
        unit: healthData.unit,
        system: FHIR_SYSTEMS.UCUM,
        code: this.getUCUMCode(healthData.unit),
      },
    };

    // Add device reference if available
    if (healthData.sourceDevice) {
      observation.device = {
        display: healthData.sourceDevice,
      };
    }

    return observation;
  }

  // Convert user to FHIR Patient
  createPatient(user: User): FHIRPatient {
    const patient: FHIRPatient = {
      resourceType: 'Patient',
      id: user.id,
      meta: {
        versionId: '1',
        lastUpdated: toFHIRDateTime(user.updatedAt),
      },
      active: true,
      identifier: [
        {
          use: 'official',
          system: 'urn:ietf:rfc:3986',
          value: user.id,
        },
      ],
      name: [
        {
          use: 'official',
          text: user.displayName,
          family: user.displayName.split(' ').pop(),
          given: user.displayName.split(' ').slice(0, -1),
        },
      ],
    };

    // Add telecom if email exists
    if (user.email) {
      patient.telecom = [
        {
          system: 'email',
          value: user.email,
          use: 'home',
        },
      ];

      if (user.phoneNumber) {
        patient.telecom.push({
          system: 'phone',
          value: user.phoneNumber,
          use: 'mobile',
        });
      }
    }

    // Add gender if available
    if (user.genderIdentity) {
      const genderMap: Record<string, 'male' | 'female' | 'other'> = {
        male: 'male',
        female: 'female',
        'non-binary': 'other',
        other: 'other',
      };
      patient.gender = genderMap[user.genderIdentity.toLowerCase()] || 'unknown';
    }

    // Add birth date if available
    if (user.dateOfBirth) {
      patient.birthDate = toFHIRDateTime(user.dateOfBirth).split('T')[0];
    }

    return patient;
  }

  // Create FHIR QuestionnaireResponse
  createQuestionnaireResponse(
    questionnaireId: string,
    userId: string,
    answers: Record<string, any>,
    status: 'in-progress' | 'completed' = 'completed'
  ): FHIRQuestionnaireResponse {
    const response: FHIRQuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      meta: {
        lastUpdated: toFHIRDateTime(new Date()),
      },
      questionnaire: questionnaireId,
      status,
      subject: {
        reference: `Patient/${userId}`,
        type: 'Patient',
      },
      authored: toFHIRDateTime(new Date()),
      author: {
        reference: `Patient/${userId}`,
        type: 'Patient',
      },
      item: this.convertAnswersToItems(answers),
    };

    return response;
  }

  private convertAnswersToItems(
    answers: Record<string, any>
  ): QuestionnaireResponseItem[] {
    return Object.entries(answers).map(([linkId, value]) => {
      const item: QuestionnaireResponseItem = {
        linkId,
        answer: [this.createAnswer(value)],
      };
      return item;
    });
  }

  private createAnswer(value: any): any {
    if (typeof value === 'boolean') {
      return { valueBoolean: value };
    } else if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { valueInteger: value }
        : { valueDecimal: value };
    } else if (typeof value === 'string') {
      // Check if it's a date
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return { valueDate: value };
      }
      return { valueString: value };
    } else if (typeof value === 'object' && value.code) {
      // Coding answer
      return { valueCoding: value };
    }

    return { valueString: String(value) };
  }

  // Get FHIR code for health data type
  private getCodeForDataType(dataType: HealthDataType): CodeableConcept {
    const codeMap: Record<HealthDataType, CodeableConcept> = {
      steps: {
        coding: [HEALTH_DATA_CODES.STEPS],
        text: 'Number of steps',
      },
      heart_rate: {
        coding: [HEALTH_DATA_CODES.HEART_RATE],
        text: 'Heart rate',
      },
      blood_pressure: {
        coding: [
          HEALTH_DATA_CODES.BLOOD_PRESSURE_SYSTOLIC,
          HEALTH_DATA_CODES.BLOOD_PRESSURE_DIASTOLIC,
        ],
        text: 'Blood pressure',
      },
      blood_glucose: {
        coding: [
          {
            system: FHIR_SYSTEMS.LOINC,
            code: '2339-0',
            display: 'Glucose [Mass/volume] in Blood',
          },
        ],
        text: 'Blood glucose',
      },
      weight: {
        coding: [HEALTH_DATA_CODES.WEIGHT],
        text: 'Body weight',
      },
      height: {
        coding: [HEALTH_DATA_CODES.HEIGHT],
        text: 'Body height',
      },
      temperature: {
        coding: [HEALTH_DATA_CODES.TEMPERATURE],
        text: 'Body temperature',
      },
      oxygen_saturation: {
        coding: [HEALTH_DATA_CODES.OXYGEN_SATURATION],
        text: 'Oxygen saturation',
      },
      sleep: {
        coding: [
          {
            system: FHIR_SYSTEMS.LOINC,
            code: '93832-4',
            display: 'Sleep duration',
          },
        ],
        text: 'Sleep duration',
      },
      activity: {
        coding: [
          {
            system: FHIR_SYSTEMS.LOINC,
            code: '82290-8',
            display: 'Physical activity',
          },
        ],
        text: 'Physical activity',
      },
      nutrition: {
        coding: [
          {
            system: FHIR_SYSTEMS.LOINC,
            code: '9052-2',
            display: 'Calorie intake total',
          },
        ],
        text: 'Nutrition',
      },
    };

    return (
      codeMap[dataType] || {
        coding: [],
        text: dataType,
      }
    );
  }

  // Get FHIR category for health data type
  private getCategoryForDataType(dataType: HealthDataType): CodeableConcept {
    const vitalSigns: HealthDataType[] = [
      'heart_rate',
      'blood_pressure',
      'temperature',
      'oxygen_saturation',
      'weight',
      'height',
    ];

    if (vitalSigns.includes(dataType)) {
      return OBSERVATION_CATEGORIES.VITAL_SIGNS;
    }

    if (dataType === 'steps' || dataType === 'activity') {
      return OBSERVATION_CATEGORIES.ACTIVITY;
    }

    if (dataType === 'blood_glucose') {
      return OBSERVATION_CATEGORIES.LABORATORY;
    }

    return OBSERVATION_CATEGORIES.ACTIVITY;
  }

  // Get UCUM code for unit
  private getUCUMCode(unit: string): string {
    const ucumMap: Record<string, string> = {
      count: '{count}',
      steps: '{steps}',
      'beats/min': '/min',
      'bpm': '/min',
      'mmHg': 'mm[Hg]',
      'mg/dL': 'mg/dL',
      'mmol/L': 'mmol/L',
      'kg': 'kg',
      'lb': '[lb_av]',
      'cm': 'cm',
      'in': '[in_i]',
      'ft': '[ft_i]',
      'degC': 'Cel',
      'degF': '[degF]',
      '%': '%',
      'min': 'min',
      'hr': 'h',
      'kcal': 'kcal',
      'cal': 'cal',
    };

    return ucumMap[unit] || unit;
  }

  // Validate FHIR resource
  validateObservation(observation: FHIRObservation): boolean {
    try {
      if (!observation.resourceType || observation.resourceType !== 'Observation') {
        logger.error('Invalid resourceType for Observation');
        return false;
      }

      if (!observation.status) {
        logger.error('Observation must have a status');
        return false;
      }

      if (!observation.code) {
        logger.error('Observation must have a code');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate Observation', error);
      return false;
    }
  }

  validateQuestionnaireResponse(response: FHIRQuestionnaireResponse): boolean {
    try {
      if (!response.resourceType || response.resourceType !== 'QuestionnaireResponse') {
        logger.error('Invalid resourceType for QuestionnaireResponse');
        return false;
      }

      if (!response.status) {
        logger.error('QuestionnaireResponse must have a status');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate QuestionnaireResponse', error);
      return false;
    }
  }

  // Export FHIR bundle
  createBundle(resources: any[]): any {
    return {
      resourceType: 'Bundle',
      type: 'collection',
      meta: {
        lastUpdated: toFHIRDateTime(new Date()),
      },
      entry: resources.map((resource) => ({
        resource,
      })),
    };
  }
}

export const fhirService = new FHIRService();
export default fhirService;
