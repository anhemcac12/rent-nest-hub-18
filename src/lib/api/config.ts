// API Configuration
// Change this URL when your ngrok link changes
export const API_BASE_URL = "http://localhost:8081";

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

  // Saved Properties
  SAVED_PROPERTIES: "/api/users/me/saved-properties",
  SAVED_PROPERTY_STATUS: (propertyId: number) => `/api/users/me/saved-properties/${propertyId}/status`,
  UNSAVE_PROPERTY: (propertyId: number) => `/api/users/me/saved-properties/${propertyId}`,

  // Lease Applications
  LEASE_APPLICATIONS: "/api/lease-applications",
  LEASE_APPLICATIONS_MY: "/api/lease-applications/my",
  LEASE_APPLICATIONS_FOR_PROPERTY: (propertyId: number) => `/api/lease-applications/for-property/${propertyId}`,
  LEASE_APPLICATION_APPROVE: (applicationId: number) => `/api/lease-applications/${applicationId}/approve`,
  LEASE_APPLICATION_REJECT: (applicationId: number) => `/api/lease-applications/${applicationId}/reject`,
  LEASE_APPLICATION_CANCEL: (applicationId: number) => `/api/lease-applications/${applicationId}/cancel`,

  // Lease Agreements
  LEASE_AGREEMENTS: "/api/lease-agreements",
  LEASE_AGREEMENT_DETAIL: (leaseId: number) => `/api/lease-agreements/${leaseId}`,
  LEASE_AGREEMENTS_MY: "/api/lease-agreements/my",
  LEASE_AGREEMENTS_FOR_LANDLORD: "/api/lease-agreements/for-landlord",
  LEASE_AGREEMENTS_FOR_PROPERTY: (propertyId: number) => `/api/lease-agreements/for-property/${propertyId}`,
  LEASE_AGREEMENT_CONTRACT: (leaseId: number) => `/api/lease-agreements/${leaseId}/contract`,
  LEASE_AGREEMENT_ACCEPT: (leaseId: number) => `/api/lease-agreements/${leaseId}/accept`,
  LEASE_AGREEMENT_REJECT: (leaseId: number) => `/api/lease-agreements/${leaseId}/reject`,
  LEASE_AGREEMENT_DEADLINE_STATUS: (leaseId: number) => `/api/lease-agreements/${leaseId}/deadline-status`,
  LEASE_AGREEMENT_ACTIVATE: (leaseId: number) => `/api/lease-agreements/${leaseId}/activate`,
  LEASE_AGREEMENT_TERMINATE: (leaseId: number) => `/api/lease-agreements/${leaseId}/terminate`,

  // Payments
  PAYMENTS_FOR_LEASE: (leaseId: number) => `/api/payments/lease/${leaseId}`,
  PAYMENT_ACCEPTANCE: (leaseId: number) => `/api/payments/lease/${leaseId}/acceptance-payment`,
  PAYMENT_SUMMARY: (leaseId: number) => `/api/payments/lease/${leaseId}/summary`,
  PAYMENT_TENANT_PAY: (leaseId: number) => `/api/payments/lease/${leaseId}/pay`,

  // Rent Schedule
  RENT_SCHEDULE: (leaseId: number) => `/api/leases/${leaseId}/rent-schedule`,
  RENT_SCHEDULE_CURRENT: (leaseId: number) => `/api/leases/${leaseId}/rent-schedule/current`,
  RENT_SCHEDULE_PAY: (leaseId: number, scheduleId: number) => `/api/leases/${leaseId}/rent-schedule/${scheduleId}/pay`,
  RENT_SCHEDULE_WAIVE: (leaseId: number, scheduleId: number) => `/api/leases/${leaseId}/rent-schedule/${scheduleId}/waive`,
  RENT_SCHEDULE_UPCOMING: `/api/leases/rent-schedule/upcoming`,
} as const;

// Token storage keys
export const TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const USER_KEY = "current_user";
