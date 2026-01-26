/**
 * INTELLIC Medication Module
 *
 * Medication tracking and management:
 * - Medication list
 * - Dosing schedules
 * - Medication reminders
 * - Adherence tracking
 * - FHIR MedicationRequest/MedicationStatement support
 */

import firebaseService from './firebase';
// import fhirService from './fhir'; // TODO: Use for FHIR MedicationRequest conversion
import schedulerService from './scheduler';
// import notificationService from './notification'; // Notifications handled via scheduler
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { RecurrenceRule } from '@/types';

export interface Medication {
  id: string;
  userId: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: MedicationForm;
  route: MedicationRoute;
  frequency: string;
  schedule?: DoseSchedule[];
  startDate: Date;
  endDate?: Date;
  prescriberId?: string;
  prescriberName?: string;
  instructions?: string;
  sideEffects?: string[];
  active: boolean;
  adherenceRate?: number;
}

export type MedicationForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'inhaler' | 'patch' | 'cream' | 'other';
export type MedicationRoute = 'oral' | 'topical' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'inhalation' | 'other';

export interface DoseSchedule {
  time: string; // HH:MM format
  amount: string;
  instructions?: string;
}

export interface MedicationDose {
  id: string;
  medicationId: string;
  userId: string;
  scheduledTime: Date;
  takenTime?: Date;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  amount: string;
  notes?: string;
}

export class MedicationService {
  async addMedication(medication: Omit<Medication, 'id'>): Promise<Medication> {
    try {
      const id = `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const med: Medication = { ...medication, id, active: true };

      await firebaseService.setDocument(`users/${medication.userId}/medications`, id, med);

      // Schedule reminders
      if (med.schedule) {
        await this.scheduleMedicationReminders(med);
      }

      await auditService.log(medication.userId, 'create', 'health_data', id, {
        name: medication.name,
        type: 'medication',
      });

      logger.info('Medication added', { id, name: medication.name });
      return med;
    } catch (error) {
      logger.error('Failed to add medication', error);
      throw error;
    }
  }

  async updateMedication(userId: string, medicationId: string, updates: Partial<Medication>): Promise<void> {
    try {
      await firebaseService.updateDocument(`users/${userId}/medications`, medicationId, updates);

      // Update reminders if schedule changed
      if (updates.schedule) {
        const medication = await this.getMedication(userId, medicationId);
        if (medication) {
          await this.scheduleMedicationReminders(medication);
        }
      }

      await auditService.log(userId, 'update', 'health_data', medicationId);
      logger.info('Medication updated', { medicationId });
    } catch (error) {
      logger.error('Failed to update medication', error);
      throw error;
    }
  }

  async deleteMedication(userId: string, medicationId: string): Promise<void> {
    try {
      await firebaseService.deleteDocument(`users/${userId}/medications`, medicationId);
      await auditService.log(userId, 'delete', 'health_data', medicationId);
      logger.info('Medication deleted', { medicationId });
    } catch (error) {
      logger.error('Failed to delete medication', error);
      throw error;
    }
  }

  async getMedication(userId: string, medicationId: string): Promise<Medication | null> {
    try {
      return await firebaseService.getDocument<Medication>(
        `users/${userId}/medications`,
        medicationId
      );
    } catch (error) {
      logger.error('Failed to get medication', error);
      return null;
    }
  }

  async getUserMedications(userId: string, activeOnly: boolean = true): Promise<Medication[]> {
    try {
      let medications = await firebaseService.queryDocuments<Medication>(
        `users/${userId}/medications`
      );

      if (activeOnly) {
        medications = medications.filter((m) => m.active);
      }

      await auditService.logDataAccess(userId, 'health_data', 'medications');
      return medications;
    } catch (error) {
      logger.error('Failed to get user medications', error);
      return [];
    }
  }

  private async scheduleMedicationReminders(medication: Medication): Promise<void> {
    if (!medication.schedule) return;

    try {
      for (const dose of medication.schedule) {
        const [hours, minutes] = dose.time.split(':').map(Number);

        // Create recurring task for each dose time
        const scheduledFor = new Date();
        scheduledFor.setHours(hours, minutes, 0, 0);

        const recurrence: RecurrenceRule = {
          frequency: 'daily',
          interval: 1,
          endDate: medication.endDate,
        };

        await schedulerService.scheduleTask(medication.userId, {
          userId: medication.userId,
          title: `Take ${medication.name}`,
          description: `${dose.amount} - ${medication.dosage}`,
          taskType: 'reminder',
          status: 'pending',
          scheduledFor,
          recurrence,
          metadata: {
            medicationId: medication.id,
            dosage: dose.amount,
            type: 'medication',
          },
        });
      }

      logger.info('Medication reminders scheduled', { medicationId: medication.id });
    } catch (error) {
      logger.error('Failed to schedule medication reminders', error);
    }
  }

  async recordDose(dose: Omit<MedicationDose, 'id'>): Promise<void> {
    try {
      const id = `dose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const doseRecord: MedicationDose = { ...dose, id };

      await firebaseService.setDocument(
        `users/${dose.userId}/medicationDoses`,
        id,
        doseRecord
      );

      // Update adherence rate
      await this.updateAdherenceRate(dose.userId, dose.medicationId);

      await auditService.log(dose.userId, 'create', 'health_data', id, {
        type: 'medication_dose',
        status: dose.status,
      });

      logger.info('Medication dose recorded', { id, status: dose.status });
    } catch (error) {
      logger.error('Failed to record dose', error);
      throw error;
    }
  }

  async getDoseHistory(userId: string, medicationId?: string, days: number = 30): Promise<MedicationDose[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let doses = await firebaseService.queryDocuments<MedicationDose>(
        `users/${userId}/medicationDoses`
      );

      doses = doses.filter((d) => new Date(d.scheduledTime) >= startDate);

      if (medicationId) {
        doses = doses.filter((d) => d.medicationId === medicationId);
      }

      return doses.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
    } catch (error) {
      logger.error('Failed to get dose history', error);
      return [];
    }
  }

  private async updateAdherenceRate(userId: string, medicationId: string): Promise<void> {
    try {
      const doses = await this.getDoseHistory(userId, medicationId, 30);

      if (doses.length === 0) return;

      const takenDoses = doses.filter((d) => d.status === 'taken').length;
      const totalDoses = doses.length;
      const adherenceRate = (takenDoses / totalDoses) * 100;

      await this.updateMedication(userId, medicationId, { adherenceRate });
    } catch (error) {
      logger.error('Failed to update adherence rate', error);
    }
  }

  async getAdherenceReport(userId: string, days: number = 30): Promise<{
    overallAdherence: number;
    medicationAdherence: Record<string, number>;
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
  }> {
    try {
      const doses = await this.getDoseHistory(userId, undefined, days);
      const medications = await this.getUserMedications(userId);

      const takenDoses = doses.filter((d) => d.status === 'taken').length;
      const missedDoses = doses.filter((d) => d.status === 'missed').length;
      const totalDoses = doses.length;

      const medicationAdherence: Record<string, number> = {};
      for (const med of medications) {
        const medDoses = doses.filter((d) => d.medicationId === med.id);
        const medTaken = medDoses.filter((d) => d.status === 'taken').length;
        medicationAdherence[med.id] = medDoses.length > 0 ? (medTaken / medDoses.length) * 100 : 0;
      }

      const overallAdherence = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

      return {
        overallAdherence,
        medicationAdherence,
        totalDoses,
        takenDoses,
        missedDoses,
      };
    } catch (error) {
      logger.error('Failed to get adherence report', error);
      throw error;
    }
  }

  async exportAsFHIR(userId: string): Promise<any[]> {
    try {
      const medications = await this.getUserMedications(userId, false);
      const fhirResources = medications.map((med) => this.toFHIRMedicationStatement(med));
      return fhirResources;
    } catch (error) {
      logger.error('Failed to export medications as FHIR', error);
      return [];
    }
  }

  private toFHIRMedicationStatement(medication: Medication): any {
    return {
      resourceType: 'MedicationStatement',
      id: medication.id,
      status: medication.active ? 'active' : 'stopped',
      medicationCodeableConcept: {
        text: medication.name,
      },
      subject: {
        reference: `Patient/${medication.userId}`,
      },
      effectivePeriod: {
        start: medication.startDate.toISOString(),
        end: medication.endDate?.toISOString(),
      },
      dosage: [
        {
          text: `${medication.dosage} ${medication.frequency}`,
          route: {
            text: medication.route,
          },
          doseAndRate: [
            {
              doseQuantity: {
                value: parseFloat(medication.dosage),
                unit: medication.form,
              },
            },
          ],
        },
      ],
      note: medication.instructions ? [{ text: medication.instructions }] : undefined,
    };
  }
}

export const medicationService = new MedicationService();
export default medicationService;
