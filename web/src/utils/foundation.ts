/**
 * SpeziFoundation React Migration
 *
 * Migrates iOS SpeziFoundation functionality to React/Web:
 * - String extensions and utilities
 * - Date extensions and formatting
 * - Array and collection utilities
 * - Validation helpers
 * - Async utilities
 */

import { logger } from './logger';

// ===== String Utilities =====

export class StringUtils {
  /**
   * Trims whitespace and removes extra spaces
   */
  static normalize(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
  }

  /**
   * Capitalizes first letter of each word
   */
  static titleCase(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Converts to camelCase
   */
  static toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '');
  }

  /**
   * Converts to snake_case
   */
  static toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Truncates string with ellipsis
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Checks if string is valid email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Checks if string is valid phone number (basic)
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const digits = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digits.length >= 10;
  }

  /**
   * Masks sensitive data for logging
   */
  static mask(str: string, visibleChars: number = 4): string {
    if (str.length <= visibleChars) return '*'.repeat(str.length);
    return str.substring(0, visibleChars) + '*'.repeat(str.length - visibleChars);
  }
}

// ===== Date Utilities =====

export class DateUtils {
  /**
   * Checks if date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Checks if date is yesterday
   */
  static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  }

  /**
   * Checks if date is tomorrow
   */
  static isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  }

  /**
   * Gets start of day
   */
  static startOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Gets end of day
   */
  static endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Adds days to date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Adds months to date
   */
  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Gets difference in days
   */
  static differenceInDays(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Gets difference in hours
   */
  static differenceInHours(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60));
  }

  /**
   * Formats date as ISO string without timezone
   */
  static toISODateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parses ISO date string
   */
  static fromISODateString(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }
}

// ===== Array Utilities =====

export class ArrayUtils {
  /**
   * Groups array by key function
   */
  static groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((result, item) => {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  /**
   * Removes duplicates from array
   */
  static unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  /**
   * Removes duplicates by key function
   */
  static uniqueBy<T>(array: T[], keyFn: (item: T) => any): T[] {
    const seen = new Set();
    return array.filter((item) => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Chunks array into smaller arrays
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Flattens nested array
   */
  static flatten<T>(array: (T | T[])[]): T[] {
    return array.reduce((flat, item) => {
      return flat.concat(Array.isArray(item) ? ArrayUtils.flatten(item) : item);
    }, [] as T[]);
  }

  /**
   * Sorts array by key function
   */
  static sortBy<T>(array: T[], keyFn: (item: T) => any, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aKey = keyFn(a);
      const bKey = keyFn(b);
      if (aKey < bKey) return order === 'asc' ? -1 : 1;
      if (aKey > bKey) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

// ===== Validation Utilities =====

export class ValidationUtils {
  /**
   * Validates required field
   */
  static required(value: any): string | null {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  }

  /**
   * Validates minimum length
   */
  static minLength(value: string, min: number): string | null {
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  }

  /**
   * Validates maximum length
   */
  static maxLength(value: string, max: number): string | null {
    if (value.length > max) {
      return `Must be at most ${max} characters`;
    }
    return null;
  }

  /**
   * Validates email format
   */
  static email(value: string): string | null {
    if (!StringUtils.isValidEmail(value)) {
      return 'Invalid email format';
    }
    return null;
  }

  /**
   * Validates phone format
   */
  static phone(value: string): string | null {
    if (!StringUtils.isValidPhone(value)) {
      return 'Invalid phone number';
    }
    return null;
  }

  /**
   * Validates minimum value
   */
  static min(value: number, min: number): string | null {
    if (value < min) {
      return `Must be at least ${min}`;
    }
    return null;
  }

  /**
   * Validates maximum value
   */
  static max(value: number, max: number): string | null {
    if (value > max) {
      return `Must be at most ${max}`;
    }
    return null;
  }

  /**
   * Validates date range
   */
  static dateRange(date: Date, min?: Date, max?: Date): string | null {
    if (min && date < min) {
      return `Date must be after ${min.toLocaleDateString()}`;
    }
    if (max && date > max) {
      return `Date must be before ${max.toLocaleDateString()}`;
    }
    return null;
  }

  /**
   * Validates password strength
   */
  static passwordStrength(
    value: string,
    requirements: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    } = {}
  ): string | null {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = false,
    } = requirements;

    if (value.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }

    if (requireUppercase && !/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (requireLowercase && !/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (requireNumbers && !/\d/.test(value)) {
      return 'Password must contain at least one number';
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return 'Password must contain at least one special character';
    }

    return null;
  }

  /**
   * Runs multiple validators
   */
  static combine(...validators: Array<(value: any) => string | null>) {
    return (value: any): string | null => {
      for (const validator of validators) {
        const error = validator(value);
        if (error) return error;
      }
      return null;
    };
  }
}

// ===== Async Utilities =====

export class AsyncUtils {
  /**
   * Delays execution
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retries async operation
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delayMs?: number;
      backoff?: 'fixed' | 'exponential';
      onRetry?: (error: Error, attempt: number) => void;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, delayMs = 1000, backoff = 'exponential', onRetry } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = backoff === 'exponential' ? delayMs * Math.pow(2, attempt) : delayMs;

          if (onRetry) {
            onRetry(lastError, attempt + 1);
          }

          logger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, { delay, error: lastError.message });

          await AsyncUtils.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Executes with timeout
   */
  static async timeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError?: Error): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Batches async operations
   */
  static async batch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    const chunks = ArrayUtils.chunk(items, batchSize);

    for (const chunk of chunks) {
      const batchResults = await processor(chunk);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Runs async operations in parallel with concurrency limit
   */
  static async parallel<T, R>(
    items: T[],
    concurrency: number,
    processor: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = processor(item).then((result) => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }
}

// ===== Debounce & Throttle =====

export class TimingUtils {
  /**
   * Debounces function execution
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
      }, waitMs);
    };
  }

  /**
   * Throttles function execution
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limitMs: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limitMs);
      }
    };
  }
}

// Export all utilities as default
export default {
  StringUtils,
  DateUtils,
  ArrayUtils,
  ValidationUtils,
  AsyncUtils,
  TimingUtils,
};
