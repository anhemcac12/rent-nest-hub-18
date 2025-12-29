import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { getAuthToken } from "./client";

// Types
export type FileCategory = "USER_AVATAR" | "ID_CARD" | "PROPERTY_PHOTO" | "LEASE_PDF";

export interface UploadFileResponse {
  documentId: number;
  url: string;
  fileType: string;
  bucket: string;
  path: string;
  contentType: string;
  size: number;
}

export interface SignedUrlResponse {
  signedUrl: string;
}

// File API service
export const fileApi = {
  // Upload a file
  upload: async (file: File, category: FileCategory): Promise<UploadFileResponse> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FILES_UPLOAD}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to upload file");
    }

    return response.json();
  },

  // Delete a file
  delete: async (documentId: number): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.FILES_DELETE(documentId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete file");
    }
  },

  // Get signed URL for private documents
  getSignedUrl: async (documentId: number): Promise<SignedUrlResponse> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS_SIGNED_URL(documentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to get signed URL");
    }

    return response.json();
  },

  // Helper: Upload avatar
  uploadAvatar: async (file: File): Promise<UploadFileResponse> => {
    return fileApi.upload(file, "USER_AVATAR");
  },

  // Helper: Upload ID card
  uploadIdCard: async (file: File): Promise<UploadFileResponse> => {
    return fileApi.upload(file, "ID_CARD");
  },

  // Helper: Upload property photo
  uploadPropertyPhoto: async (file: File): Promise<UploadFileResponse> => {
    return fileApi.upload(file, "PROPERTY_PHOTO");
  },

  // Helper: Upload lease PDF
  uploadLeasePdf: async (file: File): Promise<UploadFileResponse> => {
    return fileApi.upload(file, "LEASE_PDF");
  },
};
