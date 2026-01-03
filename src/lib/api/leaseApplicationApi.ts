// Lease Applications API
import { api } from './client';
import { API_ENDPOINTS } from './config';

// Types based on the backend DTO structure
export type LeaseApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface PropertySummaryDTO {
  id: number;
  title: string;
  address: string;
  price: number | null;
  rentAmount: number;
  currency: string | null;
  type: string | null;
  status: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  roomAmount: number | null;
  coverImageUrl: string | null;
  thumbnail: string | null;
  rating: number | null;
  reviewsCount: number | null;
  featured: boolean | null;
  verified: boolean | null;
  isNew: boolean | null;
}

export interface PublicUserProfileDTO {
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: 'ADMIN' | 'LANDLORD' | 'TENANT' | 'PROPERTY_MANAGER';
  createdAt: string | null;
  avatarUrl: string | null;
}

export interface LeaseApplicationResponseDTO {
  id: number;
  property: PropertySummaryDTO;
  tenant: PublicUserProfileDTO;
  status: LeaseApplicationStatus;
  applicationDate: string;
  message: string | null;
}

export interface LeaseApplicationRequestDTO {
  propertyId: number;
  message?: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export const leaseApplicationApi = {
  /**
   * Submit a new lease application (Tenant)
   * POST /api/lease-applications
   */
  async createApplication(data: LeaseApplicationRequestDTO): Promise<LeaseApplicationResponseDTO> {
    return api.post<LeaseApplicationResponseDTO>(
      API_ENDPOINTS.LEASE_APPLICATIONS,
      data
    );
  },

  /**
   * Get all applications submitted by the current tenant
   * GET /api/lease-applications/my
   */
  async getMyApplications(): Promise<LeaseApplicationResponseDTO[]> {
    return api.get<LeaseApplicationResponseDTO[]>(
      API_ENDPOINTS.LEASE_APPLICATIONS_MY
    );
  },

  /**
   * Get all applications for a specific property (Landlord/Manager)
   * GET /api/lease-applications/for-property/{propertyId}
   */
  async getApplicationsForProperty(propertyId: number): Promise<LeaseApplicationResponseDTO[]> {
    return api.get<LeaseApplicationResponseDTO[]>(
      API_ENDPOINTS.LEASE_APPLICATIONS_FOR_PROPERTY(propertyId)
    );
  },

  /**
   * Approve an application (Landlord/Manager)
   * PATCH /api/lease-applications/{id}/approve
   */
  async approveApplication(applicationId: number): Promise<LeaseApplicationResponseDTO> {
    return api.patch<LeaseApplicationResponseDTO>(
      API_ENDPOINTS.LEASE_APPLICATION_APPROVE(applicationId)
    );
  },

  /**
   * Reject an application (Landlord/Manager)
   * PATCH /api/lease-applications/{id}/reject
   */
  async rejectApplication(applicationId: number): Promise<LeaseApplicationResponseDTO> {
    return api.patch<LeaseApplicationResponseDTO>(
      API_ENDPOINTS.LEASE_APPLICATION_REJECT(applicationId)
    );
  },

  /**
   * Cancel an application (Tenant)
   * PATCH /api/lease-applications/{id}/cancel
   */
  async cancelApplication(applicationId: number): Promise<LeaseApplicationResponseDTO> {
    return api.patch<LeaseApplicationResponseDTO>(
      API_ENDPOINTS.LEASE_APPLICATION_CANCEL(applicationId)
    );
  },
};
