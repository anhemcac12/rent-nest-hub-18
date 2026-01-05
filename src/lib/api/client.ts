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
      // Extract error message from backend response
      let errorMessage = 'An error occurred';
      
      if (typeof data === 'object' && data !== null) {
        const errorData = data as Record<string, unknown>;
        errorMessage = 
          (errorData.message as string) || 
          (errorData.error as string) || 
          (errorData.detail as string) ||
          (Array.isArray(errorData.errors) ? errorData.errors.join(', ') : '') ||
          `Error ${response.status}`;
      }

      throw new ApiError(errorMessage, response.status, data);
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

  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers: HeadersInit = {
      'ngrok-skip-browser-warning': 'true',
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = data?.message || data?.error || `Error ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return response.json();
  },
};
