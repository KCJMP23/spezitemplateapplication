import {
  FHIRQuestionnaire,
  FHIRQuestionnaireResponse,
  QuestionnaireResponseItem,
} from '@/types/fhir';
import { ScheduledTask, RecurrenceRule } from '@/types';
import firebaseService from './firebase';
import fhirService from './fhir';
import schedulerService from './scheduler';
import notificationService from './notification';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { generateUUID } from '@/utils/helpers';

class QuestionnaireService {
  // Load questionnaire from public folder
  async loadQuestionnaire(questionnaireId: string): Promise<FHIRQuestionnaire> {
    try {
      const response = await fetch(`/questionnaires/${questionnaireId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load questionnaire: ${response.statusText}`);
      }
      const questionnaire: FHIRQuestionnaire = await response.json();
      return questionnaire;
    } catch (error) {
      logger.error('Failed to load questionnaire', error);
      throw error;
    }
  }

  // Get all available questionnaires
  async getAvailableQuestionnaires(): Promise<FHIRQuestionnaire[]> {
    // In a real app, this would query Firestore or an API
    // For now, return the sample questionnaire
    try {
      const socialSupport = await this.loadQuestionnaire('SocialSupportQuestionnaire');
      return [socialSupport];
    } catch (error) {
      logger.error('Failed to get available questionnaires', error);
      return [];
    }
  }

  // Save questionnaire response
  async saveResponse(
    userId: string,
    questionnaireId: string,
    answers: Record<string, any>,
    status: 'in-progress' | 'completed' = 'completed'
  ): Promise<FHIRQuestionnaireResponse> {
    try {
      const response = fhirService.createQuestionnaireResponse(
        questionnaireId,
        userId,
        answers,
        status
      );

      // Save to Firestore
      const responseId = response.id || generateUUID();
      response.id = responseId;

      await firebaseService.setDocument(
        `users/${userId}/questionnaireResponses`,
        responseId,
        response
      );

      // Audit log
      await auditService.log(
        userId,
        'create',
        'questionnaire',
        responseId,
        {
          questionnaireId,
          status,
          itemCount: answers ? Object.keys(answers).length : 0,
        }
      );

      logger.info('Questionnaire response saved', {
        userId,
        questionnaireId,
        responseId,
      });

      return response;
    } catch (error) {
      logger.error('Failed to save questionnaire response', error);
      throw error;
    }
  }

  // Get user's questionnaire responses
  async getUserResponses(
    userId: string,
    questionnaireId?: string
  ): Promise<FHIRQuestionnaireResponse[]> {
    try {
      let responses = await firebaseService.queryDocuments<FHIRQuestionnaireResponse>(
        `users/${userId}/questionnaireResponses`
      );

      if (questionnaireId) {
        responses = responses.filter((r) => r.questionnaire === questionnaireId);
      }

      await auditService.logDataAccess(userId, 'questionnaire', questionnaireId || 'all');

      return responses;
    } catch (error) {
      logger.error('Failed to get user responses', error);
      return [];
    }
  }

  // Get scheduled questionnaires for a user
  async getScheduledQuestionnaires(userId: string): Promise<ScheduledTask[]> {
    try {
      const tasks = await schedulerService.getUserTasks(userId);

      // Filter for questionnaire tasks
      return tasks.filter(
        (task) =>
          task.taskType === 'questionnaire' &&
          task.status !== 'completed' &&
          task.status !== 'cancelled'
      );
    } catch (error) {
      logger.error('Failed to get scheduled questionnaires', error);
      return [];
    }
  }

  // Create a scheduled questionnaire task
  async scheduleQuestionnaire(
    userId: string,
    questionnaireId: string,
    scheduledFor: Date,
    recurrence?: RecurrenceRule
  ): Promise<ScheduledTask> {
    try {
      const questionnaire = await this.loadQuestionnaire(questionnaireId);

      const task = await schedulerService.scheduleTask(userId, {
        userId,
        title: questionnaire.title || 'Complete Questionnaire',
        description: questionnaire.description || 'Please complete your scheduled questionnaire',
        taskType: 'questionnaire',
        status: 'pending',
        scheduledFor,
        questionnaireId,
        recurrence,
        metadata: {
          questionnaireId,
        },
      });

      // Schedule notification reminder
      await notificationService.sendQuestionnaireReminder(
        userId,
        task.title,
        questionnaireId
      );

      logger.info('Questionnaire scheduled with reminder', {
        userId,
        questionnaireId,
        scheduledFor,
      });

      return task;
    } catch (error) {
      logger.error('Failed to schedule questionnaire', error);
      throw error;
    }
  }

  // Mark task as completed
  async completeTask(userId: string, taskId: string): Promise<void> {
    try {
      await schedulerService.completeTask(userId, taskId);
      logger.info('Task completed', { userId, taskId });
    } catch (error) {
      logger.error('Failed to complete task', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(
    userId: string,
    taskId: string,
    status: ScheduledTask['status']
  ): Promise<void> {
    try {
      await schedulerService.updateTask(userId, taskId, { status });
      logger.info('Task status updated', { userId, taskId, status });
    } catch (error) {
      logger.error('Failed to update task status', error);
      throw error;
    }
  }
}

export const questionnaireService = new QuestionnaireService();
export default questionnaireService;
