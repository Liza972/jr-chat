import { ValidationResult } from './types';

export class MessageValidator {
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];
    
    if (!username || username.trim().length === 0) {
      errors.push('Имя пользователя обязательно');
    } else {
      const trimmed = username.trim();
      if (trimmed.length < 2) {
        errors.push('Имя пользователя должно содержать минимум 2 символа');
      }
      if (trimmed.length > 50) {
        errors.push('Имя пользователя должно содержать не более 50 символов');
      }
      if (!/^[a-zA-Zа-яА-Я0-9_\s]+$/.test(trimmed)) {
        errors.push('Имя пользователя содержит недопустимые символы');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateMessageText(text: string): ValidationResult {
    const errors: string[] = [];
    
    if (!text || text.trim().length === 0) {
      errors.push('Текст сообщения не может быть пустым');
    } else {
      const trimmed = text.trim();
      if (trimmed.length < 1) {
        errors.push('Сообщение должно содержать хотя бы 1 символ');
      }
      if (trimmed.length > 500) {
        errors.push('Сообщение должно содержать не более 500 символов');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  static parseTimestamp(timestamp: string): Date {
    return new Date(timestamp);
  }
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60000; // 1 минута
  private readonly maxRequests: number = 60; // 60 запросов в минуту

  isRateLimited(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, [now]);
      return false;
    }
    
    const timestamps = this.requests.get(ip)!;
    const recentRequests = timestamps.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return true;
    }
    
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    
    // Очистка старых записей
    this.cleanup();
    
    return false;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [ip, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(time => time > windowStart);
      if (recent.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recent);
      }
    }
  }
}