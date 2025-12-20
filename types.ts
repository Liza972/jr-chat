export interface Message {
  id: number;
  username: string;
  text: string;
  timestamp: string;
}

export interface CreateMessageRequest {
  username: string;
  text: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}