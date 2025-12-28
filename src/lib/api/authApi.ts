import { api, setAuthToken, removeAuthToken, ApiError } from './client';
import { API_ENDPOINTS, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from './config';
import { UserRole } from '@/types/user';

// Auth API Types
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// API response user type (from backend)
interface ApiUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  phoneNumber: string | null;
}

// Normalized user type (for frontend)
export interface NormalizedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar: string | null;
  phone: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: ApiUser;
}

// Helper to normalize API user to frontend user
function normalizeUser(apiUser: ApiUser): NormalizedUser {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    fullName: apiUser.fullName,
    role: apiUser.role,
    avatar: apiUser.avatarUrl,
    phone: apiUser.phoneNumber,
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface PerformResetRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Auth API Service
export const authApi = {
  // Register a new user
  register: async (data: RegisterRequest): Promise<void> => {
    await api.post<void>(API_ENDPOINTS.AUTH_REGISTER, data);
  },

  // Login user
  login: async (data: LoginRequest): Promise<NormalizedUser> => {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, data);
    
    // Normalize and store user data
    const normalizedUser = normalizeUser(response.user);
    
    // Store tokens and user data
    setAuthToken(response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    
    return normalizedUser;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post<void>(API_ENDPOINTS.AUTH_LOGOUT);
    } finally {
      // Always clear local storage even if API call fails
      removeAuthToken();
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post<void>(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, data);
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post<void>(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, data);
  },

  // Perform password reset
  performReset: async (data: PerformResetRequest): Promise<void> => {
    await api.post<void>(API_ENDPOINTS.AUTH_PERFORM_RESET, data);
  },

  // Get stored user from localStorage
  getStoredUser: (): NormalizedUser | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

// Re-export ApiError for use in components
export { ApiError };
