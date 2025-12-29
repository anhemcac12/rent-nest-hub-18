// API Configuration
// Change this URL when your ngrok link changes
export const API_BASE_URL = "https://87f431ead12d.ngrok-free.app";

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_CHANGE_PASSWORD: "/api/auth/change-password",
  AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password",
  AUTH_PERFORM_RESET: "/api/auth/perform-reset",

  // Users
  USER_PUBLIC_PROFILE: (userId: number) => `/api/users/${userId}`,
  USER_ME: "/api/users/me",
  USER_UNLINK_ID_DOCUMENT: "/api/users/me/identity-document",

  // Files
  FILES_UPLOAD: "/api/files/upload",
  FILES_DELETE: (documentId: number) => `/api/files/${documentId}`,

  // Documents
  DOCUMENTS_SIGNED_URL: (documentId: number) => `/api/documents/${documentId}/signed-url`,

  // Properties
  PROPERTIES: "/api/properties",
  PROPERTY_DETAIL: (propertyId: number) => `/api/properties/${propertyId}`,
  PROPERTIES_FEATURED: "/api/properties/featured",
  PROPERTIES_BY_LANDLORD: (landlordId: number) => `/api/properties/landlord/${landlordId}`,
  PROPERTY_MANAGER: (propertyId: number) => `/api/properties/${propertyId}/manager`,
} as const;

// Token storage keys
export const TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const USER_KEY = "current_user";
