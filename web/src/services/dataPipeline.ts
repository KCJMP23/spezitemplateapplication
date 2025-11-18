/**
 * SpeziDataPipeline React Migration
 *
 * Data processing pipeline:
 * - Data transformation
 * - Data aggregation
 * - ETL (Extract, Transform, Load) operations
 * - Data quality checks
 * - Batch processing
 */

import { logger } from '@/utils/logger';
import { AsyncUtils } from '@/utils/foundation';
import firebaseService from './firebase';

export interface PipelineStage<TInput = any, TOutput = any> {
  name: string;
  transform: (data: TInput) => Promise<TOutput> | TOutput;
  validate?: (data: TOutput) => boolean;
  onError?: (error: Error, data: TInput) => void;
}

export interface PipelineConfig {
  id: string;
  name: string;
  stages: PipelineStage[];
  retryOnError?: boolean;
  maxRetries?: number;
  parallel?: boolean;
}

export interface PipelineResult<T = any> {
  success: boolean;
  data?: T;
  errors: Array<{ stage: string; error: Error }>;
  duration: number;
}

export class DataPipeline<TInput = any, TOutput = any> {
  private config: PipelineConfig;
  private metrics: Map<string, number> = new Map();

  constructor(config: PipelineConfig) {
    this.config = config;
  }

  async execute(input: TInput): Promise<PipelineResult<TOutput>> {
    const startTime = performance.now();
    const errors: Array<{ stage: string; error: Error }> = [];

    let currentData: any = input;

    try {
      for (const stage of this.config.stages) {
        try {
          logger.debug(`Executing pipeline stage: ${stage.name}`);

          // Execute transform
          currentData = await this.executeStage(stage, currentData);

          // Validate if validator provided
          if (stage.validate && !stage.validate(currentData)) {
            throw new Error(`Validation failed for stage: ${stage.name}`);
          }

          this.recordMetric(stage.name, 'success');
        } catch (error) {
          const err = error as Error;
          logger.error(`Pipeline stage failed: ${stage.name}`, err);

          errors.push({ stage: stage.name, error: err });
          this.recordMetric(stage.name, 'error');

          if (stage.onError) {
            stage.onError(err, currentData);
          }

          if (!this.config.retryOnError) {
            break;
          }
        }
      }

      const duration = performance.now() - startTime;

      return {
        success: errors.length === 0,
        data: currentData as TOutput,
        errors,
        duration,
      };
    } catch (error) {
      logger.error('Pipeline execution failed', error);
      const duration = performance.now() - startTime;

      return {
        success: false,
        errors: [...errors, { stage: 'pipeline', error: error as Error }],
        duration,
      };
    }
  }

  private async executeStage<T, R>(stage: PipelineStage<T, R>, data: T): Promise<R> {
    if (this.config.retryOnError) {
      return AsyncUtils.retry(() => Promise.resolve(stage.transform(data)), {
        maxRetries: this.config.maxRetries || 3,
        delayMs: 1000,
        backoff: 'exponential',
      });
    }

    return stage.transform(data);
  }

  async executeBatch(inputs: TInput[]): Promise<PipelineResult<TOutput>[]> {
    if (this.config.parallel) {
      return Promise.all(inputs.map((input) => this.execute(input)));
    }

    const results: PipelineResult<TOutput>[] = [];
    for (const input of inputs) {
      results.push(await this.execute(input));
    }

    return results;
  }

  private recordMetric(stage: string, type: string): void {
    const key = `${stage}:${type}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// ===== Data Aggregation Service =====

export class DataAggregationService {
  async aggregateByTimeRange(
    data: Array<{ timestamp: Date; value: number }>,
    interval: 'hour' | 'day' | 'week' | 'month'
  ): Promise<Array<{ timestamp: Date; average: number; min: number; max: number; count: number }>> {
    const grouped = new Map<string, number[]>();

    data.forEach((item) => {
      const key = this.getTimeKey(item.timestamp, interval);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item.value);
    });

    const result: Array<{
      timestamp: Date;
      average: number;
      min: number;
      max: number;
      count: number;
    }> = [];

    grouped.forEach((values, key) => {
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      result.push({
        timestamp: new Date(key),
        average,
        min,
        max,
        count: values.length,
      });
    });

    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getTimeKey(date: Date, interval: string): string {
    const d = new Date(date);

    switch (interval) {
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        break;
      case 'month':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
    }

    return d.toISOString();
  }

  async calculateStatistics(values: number[]): Promise<{
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  }> {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      median,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }
}

// ===== Data Quality Service =====

export class DataQualityService {
  validateCompleteness(data: any, requiredFields: string[]): {
    complete: boolean;
    missingFields: string[];
  } {
    const missingFields = requiredFields.filter((field) => !(field in data) || data[field] === null || data[field] === undefined);

    return {
      complete: missingFields.length === 0,
      missingFields,
    };
  }

  validateRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  detectOutliers(values: number[], threshold: number = 2): number[] {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return values.filter((v) => Math.abs(v - mean) > threshold * std);
  }

  async generateQualityReport(userId: string, dataType: string): Promise<{
    completeness: number;
    accuracy: number;
    timeliness: number;
    consistency: number;
  }> {
    // Placeholder implementation
    return {
      completeness: 95,
      accuracy: 98,
      timeliness: 92,
      consistency: 97,
    };
  }
}

// ===== Export =====

export const dataAggregationService = new DataAggregationService();
export const dataQualityService = new DataQualityService();

export default {
  DataPipeline,
  DataAggregationService,
  dataAggregationService,
  DataQualityService,
  dataQualityService,
};
