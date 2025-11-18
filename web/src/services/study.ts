/**
 * SpeziStudy React Migration
 *
 * Study management:
 * - Clinical study enrollment
 * - Study protocols
 * - Participant management
 * - Data collection workflows
 * - Study analytics
 */

import firebaseService from './firebase';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';

export interface Study {
  id: string;
  title: string;
  description: string;
  principalInvestigator: string;
  institution: string;
  status: 'planned' | 'active' | 'paused' | 'completed' | 'terminated';
  startDate: Date;
  endDate?: Date;
  enrollmentGoal: number;
  currentEnrollment: number;
  eligibilityCriteria: EligibilityCriteria;
  dataCollectionSchedule: DataCollectionTask[];
  metadata?: Record<string, any>;
}

export interface EligibilityCriteria {
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'all';
  conditions?: string[];
  exclusions?: string[];
  customCriteria?: string[];
}

export interface DataCollectionTask {
  id: string;
  title: string;
  type: 'questionnaire' | 'health_data' | 'lab_result' | 'survey';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  duration?: number; // days
  required: boolean;
}

export interface StudyParticipant {
  id: string;
  studyId: string;
  userId: string;
  enrollmentDate: Date;
  status: 'active' | 'withdrawn' | 'completed';
  consentDate: Date;
  withdrawalDate?: Date;
  withdrawalReason?: string;
  dataCollectionProgress: Record<string, number>;
}

export interface StudyAnalytics {
  studyId: string;
  totalParticipants: number;
  activeParticipants: number;
  completedParticipants: number;
  withdrawnParticipants: number;
  dataCompletionRate: number;
  enrollmentRate: number;
  retentionRate: number;
  lastUpdated: Date;
}

export class StudyService {
  async createStudy(study: Omit<Study, 'id' | 'currentEnrollment'>): Promise<Study> {
    try {
      const id = `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newStudy: Study = {
        ...study,
        id,
        currentEnrollment: 0,
      };

      await firebaseService.setDocument('studies', id, newStudy);

      logger.info('Study created', { id, title: study.title });
      return newStudy;
    } catch (error) {
      logger.error('Failed to create study', error);
      throw error;
    }
  }

  async getStudy(studyId: string): Promise<Study | null> {
    try {
      return await firebaseService.getDocument<Study>('studies', studyId);
    } catch (error) {
      logger.error('Failed to get study', error);
      return null;
    }
  }

  async getAllStudies(activeOnly: boolean = true): Promise<Study[]> {
    try {
      let studies = await firebaseService.queryDocuments<Study>('studies');

      if (activeOnly) {
        studies = studies.filter((s) => s.status === 'active');
      }

      return studies;
    } catch (error) {
      logger.error('Failed to get studies', error);
      return [];
    }
  }

  async enrollParticipant(studyId: string, userId: string): Promise<StudyParticipant> {
    try {
      const study = await this.getStudy(studyId);
      if (!study) {
        throw new Error('Study not found');
      }

      if (study.currentEnrollment >= study.enrollmentGoal) {
        throw new Error('Study enrollment full');
      }

      const participant: StudyParticipant = {
        id: `participant_${Date.now()}`,
        studyId,
        userId,
        enrollmentDate: new Date(),
        status: 'active',
        consentDate: new Date(),
        dataCollectionProgress: {},
      };

      await firebaseService.setDocument(
        `studies/${studyId}/participants`,
        participant.id,
        participant
      );

      // Update enrollment count
      await firebaseService.updateDocument('studies', studyId, {
        currentEnrollment: study.currentEnrollment + 1,
      });

      await auditService.log(userId, 'enroll', 'study', studyId);

      logger.info('Participant enrolled', { studyId, userId });
      return participant;
    } catch (error) {
      logger.error('Failed to enroll participant', error);
      throw error;
    }
  }

  async withdrawParticipant(studyId: string, participantId: string, reason?: string): Promise<void> {
    try {
      await firebaseService.updateDocument(`studies/${studyId}/participants`, participantId, {
        status: 'withdrawn',
        withdrawalDate: new Date(),
        withdrawalReason: reason,
      });

      const study = await this.getStudy(studyId);
      if (study) {
        await firebaseService.updateDocument('studies', studyId, {
          currentEnrollment: Math.max(0, study.currentEnrollment - 1),
        });
      }

      logger.info('Participant withdrawn', { studyId, participantId, reason });
    } catch (error) {
      logger.error('Failed to withdraw participant', error);
      throw error;
    }
  }

  async getStudyParticipants(studyId: string): Promise<StudyParticipant[]> {
    try {
      return await firebaseService.queryDocuments<StudyParticipant>(
        `studies/${studyId}/participants`
      );
    } catch (error) {
      logger.error('Failed to get study participants', error);
      return [];
    }
  }

  async getStudyAnalytics(studyId: string): Promise<StudyAnalytics> {
    try {
      const participants = await this.getStudyParticipants(studyId);

      const totalParticipants = participants.length;
      const activeParticipants = participants.filter((p) => p.status === 'active').length;
      const completedParticipants = participants.filter((p) => p.status === 'completed').length;
      const withdrawnParticipants = participants.filter((p) => p.status === 'withdrawn').length;

      // Calculate data completion rate
      let totalProgress = 0;
      participants.forEach((p) => {
        const progress = Object.values(p.dataCollectionProgress);
        if (progress.length > 0) {
          totalProgress += progress.reduce((sum, val) => sum + val, 0) / progress.length;
        }
      });

      const dataCompletionRate = totalParticipants > 0 ? totalProgress / totalParticipants : 0;

      // Calculate retention rate
      const retentionRate =
        totalParticipants > 0
          ? ((totalParticipants - withdrawnParticipants) / totalParticipants) * 100
          : 0;

      const study = await this.getStudy(studyId);
      const enrollmentRate = study
        ? (study.currentEnrollment / study.enrollmentGoal) * 100
        : 0;

      return {
        studyId,
        totalParticipants,
        activeParticipants,
        completedParticipants,
        withdrawnParticipants,
        dataCompletionRate,
        enrollmentRate,
        retentionRate,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get study analytics', error);
      throw error;
    }
  }

  async updateDataCollectionProgress(
    studyId: string,
    participantId: string,
    taskId: string,
    progress: number
  ): Promise<void> {
    try {
      await firebaseService.updateDocument(`studies/${studyId}/participants`, participantId, {
        [`dataCollectionProgress.${taskId}`]: progress,
      });

      logger.debug('Data collection progress updated', { participantId, taskId, progress });
    } catch (error) {
      logger.error('Failed to update data collection progress', error);
    }
  }

  async checkEligibility(userId: string, studyId: string): Promise<{
    eligible: boolean;
    reasons: string[];
  }> {
    try {
      const study = await this.getStudy(studyId);
      if (!study) {
        return { eligible: false, reasons: ['Study not found'] };
      }

      // Get user data
      const user = await firebaseService.getDocument<any>(`users`, userId);
      if (!user) {
        return { eligible: false, reasons: ['User not found'] };
      }

      const reasons: string[] = [];
      const criteria = study.eligibilityCriteria;

      // Check age requirements
      if (criteria.minAge !== undefined || criteria.maxAge !== undefined) {
        const age = user.dateOfBirth
          ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        if (age === null) {
          reasons.push('Date of birth required for age verification');
        } else {
          if (criteria.minAge !== undefined && age < criteria.minAge) {
            reasons.push(`Minimum age requirement: ${criteria.minAge} years`);
          }
          if (criteria.maxAge !== undefined && age > criteria.maxAge) {
            reasons.push(`Maximum age requirement: ${criteria.maxAge} years`);
          }
        }
      }

      // Check gender requirements
      if (criteria.gender && criteria.gender !== 'all') {
        if (!user.gender || user.gender !== criteria.gender) {
          reasons.push(`Study requires ${criteria.gender} participants`);
        }
      }

      // Check required conditions
      if (criteria.conditions && criteria.conditions.length > 0) {
        const userConditions = user.conditions || [];
        const missingConditions = criteria.conditions.filter(
          (condition: string) => !userConditions.includes(condition)
        );
        if (missingConditions.length > 0) {
          reasons.push(`Required conditions: ${missingConditions.join(', ')}`);
        }
      }

      // Check exclusion criteria
      if (criteria.exclusions && criteria.exclusions.length > 0) {
        const userConditions = user.conditions || [];
        const excludingConditions = criteria.exclusions.filter(
          (exclusion: string) => userConditions.includes(exclusion)
        );
        if (excludingConditions.length > 0) {
          reasons.push(`Excluded due to: ${excludingConditions.join(', ')}`);
        }
      }

      // Check custom criteria (evaluates as boolean expressions)
      if (criteria.customCriteria && criteria.customCriteria.length > 0) {
        // Custom criteria would need specific implementation based on study needs
        // For now, we'll mark them as informational
        logger.debug('Custom criteria require manual review', {
          userId,
          studyId,
          criteria: criteria.customCriteria,
        });
      }

      return {
        eligible: reasons.length === 0,
        reasons,
      };
    } catch (error) {
      logger.error('Failed to check eligibility', error);
      return { eligible: false, reasons: ['Error checking eligibility'] };
    }
  }
}

export const studyService = new StudyService();
export default studyService;
