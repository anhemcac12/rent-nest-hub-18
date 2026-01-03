import { API_BASE_URL, TOKEN_KEY } from './config';

// API Error class for handling backend errors
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Safe error messages that don't expose internal details
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Please log in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'The provided data is invalid.',
  429: 'Too many requests. Please try again later.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
};

// Extract safe user-facing message from error response
function getUserFriendlyErrorMessage(status: number, data: unknown): string {
  // Check for specific known safe messages from backend (e.g., validation errors we want to show)
  if (typeof data === 'object' && data !== null) {
    const errorData = data as Record<string, unknown>;
    const message = errorData.message as string;
    
    // Only pass through specific safe messages (user-facing validation errors)
    if (message && isSafeErrorMessage(message)) {
      return message;
    }
  }
  
  // Return generic message based on status code
  return ERROR_MESSAGES[status] || 'An unexpected error occurred. Please try again.';
}

// Check if an error message is safe to display to users
function isSafeErrorMessage(message: string): boolean {
  // Allow through known user-facing validation messages
  const safePatterns = [
    /^password/i,
    /^email/i,
    /^invalid.*credentials/i,
    /already exists/i,
    /not found/i,
    /not available/i,
    /already have/i,
    /cannot.*own/i,
    /not authorized/i,
    /only pending/i,
  ];
  
  // Block messages that might contain sensitive info
  const unsafePatterns = [
    /sql/i,
    /database/i,
    /exception/i,
    /stack/i,
    /trace/i,
    /internal/i,
    /null pointer/i,
    /undefined/i,
    /connection/i,
    /timeout/i,
  ];
  
  // Check if message contains unsafe patterns
  for (const pattern of unsafePatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }
  
  // Check if message matches safe patterns
  for (const pattern of safePatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  // For short messages (likely user-facing), allow them
  if (message.length < 100 && !message.includes('\n')) {
    return true;
  }
  
  return false;
}

// Get stored auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set auth token
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove auth token
export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// API client function
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
    ...options.headers,
  };

  // Add auth token if available
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle empty responses (202, 204, etc.)
    if (response.status === 202 || response.status === 204) {
      return {} as T;
    }

    // Try to parse JSON response
    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    }

    // Handle error responses
    if (!response.ok) {
      // Log detailed error for debugging (only in development)
      if (import.meta.env.DEV && typeof data === 'object' && data !== null) {
        console.error('API Error Details:', data);
      }
      
      // Map to user-friendly error messages - don't expose internal details
      const userFriendlyMessage = getUserFriendlyErrorMessage(response.status, data);

      throw new ApiError(userFriendlyMessage, response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0,
      null
    );
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
