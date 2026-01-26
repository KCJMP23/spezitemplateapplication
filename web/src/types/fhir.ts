// FHIR R4 Types (simplified for our use case)
// Full types available from @ahryman40k/ts-fhir-types

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  device?: Reference;
}

export interface FHIRQuestionnaireResponse extends FHIRResource {
  resourceType: 'QuestionnaireResponse';
  questionnaire?: string;
  status: 'in-progress' | 'completed' | 'amended' | 'entered-in-error' | 'stopped';
  subject?: Reference;
  authored?: string;
  author?: Reference;
  item?: QuestionnaireResponseItem[];
}

export interface QuestionnaireResponseItem {
  linkId: string;
  text?: string;
  answer?: QuestionnaireResponseAnswer[];
  item?: QuestionnaireResponseItem[];
}

export interface QuestionnaireResponseAnswer {
  valueBoolean?: boolean;
  valueDecimal?: number;
  valueInteger?: number;
  valueDate?: string;
  valueDateTime?: string;
  valueTime?: string;
  valueString?: string;
  valueUri?: string;
  valueCoding?: Coding;
  valueQuantity?: Quantity;
  item?: QuestionnaireResponseItem[];
}

export interface FHIRQuestionnaire extends FHIRResource {
  resourceType: 'Questionnaire';
  url?: string;
  identifier?: Identifier[];
  version?: string;
  name?: string;
  title?: string;
  status: 'draft' | 'active' | 'retired' | 'unknown';
  experimental?: boolean;
  subjectType?: string[];
  date?: string;
  publisher?: string;
  description?: string;
  item?: QuestionnaireItem[];
}

export interface QuestionnaireItem {
  linkId: string;
  definition?: string;
  code?: Coding[];
  prefix?: string;
  text?: string;
  type: 'group' | 'display' | 'boolean' | 'decimal' | 'integer' | 'date' | 'dateTime' | 'time' | 'string' | 'text' | 'url' | 'choice' | 'open-choice' | 'attachment' | 'reference' | 'quantity';
  enableWhen?: QuestionnaireEnableWhen[];
  enableBehavior?: 'all' | 'any';
  required?: boolean;
  repeats?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  answerOption?: QuestionnaireAnswerOption[];
  answerValueSet?: string;
  initial?: QuestionnaireInitial[];
  item?: QuestionnaireItem[];
}

export interface QuestionnaireEnableWhen {
  question: string;
  operator: 'exists' | '=' | '!=' | '>' | '<' | '>=' | '<=';
  answerBoolean?: boolean;
  answerDecimal?: number;
  answerInteger?: number;
  answerDate?: string;
  answerDateTime?: string;
  answerTime?: string;
  answerString?: string;
  answerCoding?: Coding;
  answerQuantity?: Quantity;
}

export interface QuestionnaireAnswerOption {
  valueInteger?: number;
  valueDate?: string;
  valueTime?: string;
  valueString?: string;
  valueCoding?: Coding;
  initialSelected?: boolean;
}

export interface QuestionnaireInitial {
  valueBoolean?: boolean;
  valueDecimal?: number;
  valueInteger?: number;
  valueDate?: string;
  valueDateTime?: string;
  valueTime?: string;
  valueString?: string;
  valueUri?: string;
  valueCoding?: Coding;
  valueQuantity?: Quantity;
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Address[];
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface Quantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}

export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface HumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

export interface Address {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: Period;
}

// HealthKit to FHIR mapping types
export interface HealthKitToFHIRMapping {
  healthKitType: string;
  fhirCode: CodeableConcept;
  unit: string;
  category: CodeableConcept;
}

// Common FHIR coding systems
export const FHIR_SYSTEMS = {
  LOINC: 'http://loinc.org',
  SNOMED: 'http://snomed.info/sct',
  UCUM: 'http://unitsofmeasure.org',
  OBSERVATION_CATEGORY: 'http://terminology.hl7.org/CodeSystem/observation-category',
} as const;

// Common health data LOINC codes
export const HEALTH_DATA_CODES = {
  STEPS: {
    system: FHIR_SYSTEMS.LOINC,
    code: '55423-8',
    display: 'Number of steps',
  },
  HEART_RATE: {
    system: FHIR_SYSTEMS.LOINC,
    code: '8867-4',
    display: 'Heart rate',
  },
  BLOOD_PRESSURE_SYSTOLIC: {
    system: FHIR_SYSTEMS.LOINC,
    code: '8480-6',
    display: 'Systolic blood pressure',
  },
  BLOOD_PRESSURE_DIASTOLIC: {
    system: FHIR_SYSTEMS.LOINC,
    code: '8462-4',
    display: 'Diastolic blood pressure',
  },
  WEIGHT: {
    system: FHIR_SYSTEMS.LOINC,
    code: '29463-7',
    display: 'Body weight',
  },
  HEIGHT: {
    system: FHIR_SYSTEMS.LOINC,
    code: '8302-2',
    display: 'Body height',
  },
  TEMPERATURE: {
    system: FHIR_SYSTEMS.LOINC,
    code: '8310-5',
    display: 'Body temperature',
  },
  OXYGEN_SATURATION: {
    system: FHIR_SYSTEMS.LOINC,
    code: '59408-5',
    display: 'Oxygen saturation',
  },
} as const;

// FHIR Observation categories
export const OBSERVATION_CATEGORIES = {
  VITAL_SIGNS: {
    coding: [{
      system: FHIR_SYSTEMS.OBSERVATION_CATEGORY,
      code: 'vital-signs',
      display: 'Vital Signs',
    }],
  },
  ACTIVITY: {
    coding: [{
      system: FHIR_SYSTEMS.OBSERVATION_CATEGORY,
      code: 'activity',
      display: 'Activity',
    }],
  },
  LABORATORY: {
    coding: [{
      system: FHIR_SYSTEMS.OBSERVATION_CATEGORY,
      code: 'laboratory',
      display: 'Laboratory',
    }],
  },
};
