import { config } from './config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  context?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context,
    };

    // Store in memory (limited)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const formattedMessage = this.formatMessage(level, message, data);
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage, data);
        break;
    }

    // In production, send to logging service (e.g., Sentry, LogRocket)
    if (config.environment === 'production' && level === 'error') {
      this.sendToMonitoring(entry);
    }
  }

  debug(message: string, data?: any, context?: string): void {
    if (config.environment === 'development') {
      this.log('debug', message, data, context);
    }
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: Error | any, context?: string): void {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    this.log('error', message, errorData, context);
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with error monitoring service
    // Examples: Sentry, LogRocket, Datadog
    // Ensure PHI/PII is not logged!
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Healthcare compliance: Sanitize logs to remove PHI/PII
  sanitize(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'ssn',
      'socialSecurity',
      'dateOfBirth',
      'dob',
      'phoneNumber',
      'email',
      'address',
      'signature',
    ];

    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};
      for (const key in data) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof data[key] === 'object') {
          sanitized[key] = this.sanitize(data[key]);
        } else {
          sanitized[key] = data[key];
        }
      }
      return sanitized;
    }

    return data;
  }
}

export const logger = new Logger();
export default logger;
