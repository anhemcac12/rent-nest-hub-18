import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { api } from "./client";

// Types
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: "TENANT" | "LANDLORD" | "PROPERTY_MANAGER";
  avatarUrl: string | null;
  phoneNumber: string | null;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
}

// User API service
export const userApi = {
  // Get public user profile (no auth required)
  getPublicProfile: async (userId: number): Promise<UserProfile> => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USER_PUBLIC_PROFILE(userId)}`,
      {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch user profile");
    }

    return response.json();
  },

  // Get current user's profile (auth required)
  getCurrentProfile: async (): Promise<UserProfile> => {
    return api.get<UserProfile>(API_ENDPOINTS.USER_ME);
  },

  // Update current user's profile (auth required)
  updateProfile: async (data: UpdateProfileRequest): Promise<void> => {
    return api.put(API_ENDPOINTS.USER_ME, data);
  },
};
