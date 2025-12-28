// API Configuration
// Change this URL when your ngrok link changes
export const API_BASE_URL = 'https://6dd5104f4de3.ngrok-free.app';

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_PERFORM_RESET: '/api/auth/perform-reset',
} as const;

// Token storage keys
export const TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'current_user';
