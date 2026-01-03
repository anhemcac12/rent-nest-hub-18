import { api } from "./client";
import { API_BASE_URL } from "./config";

// Types
export interface SavedPropertyResponse {
  id: number;
  propertyId: number;
  savedAt: string;
  property: {
    id: number;
    title: string;
    coverImageUrl: string;
    price: number;
    city: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    size: number;
    status: string;
  };
}

export interface SavedStatusResponse {
  saved: boolean;
}

// API Endpoints
const ENDPOINTS = {
  SAVED_PROPERTIES: "/api/users/me/saved-properties",
  SAVED_PROPERTY_STATUS: (propertyId: number) => `/api/users/me/saved-properties/${propertyId}/status`,
  UNSAVE_PROPERTY: (propertyId: number) => `/api/users/me/saved-properties/${propertyId}`,
};

// API Functions
export const savedPropertiesApi = {
  /**
   * Get all saved properties for the current user
   */
  getSavedProperties: async (): Promise<SavedPropertyResponse[]> => {
    return api.get<SavedPropertyResponse[]>(ENDPOINTS.SAVED_PROPERTIES);
  },

  /**
   * Save a property
   */
  saveProperty: async (propertyId: number): Promise<SavedPropertyResponse> => {
    return api.post<SavedPropertyResponse>(ENDPOINTS.SAVED_PROPERTIES, { propertyId });
  },

  /**
   * Unsave a property
   */
  unsaveProperty: async (propertyId: number): Promise<void> => {
    return api.delete<void>(ENDPOINTS.UNSAVE_PROPERTY(propertyId));
  },

  /**
   * Check if a property is saved
   */
  checkSavedStatus: async (propertyId: number): Promise<SavedStatusResponse> => {
    return api.get<SavedStatusResponse>(ENDPOINTS.SAVED_PROPERTY_STATUS(propertyId));
  },
};

export default savedPropertiesApi;
