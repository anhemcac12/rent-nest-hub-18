import { api } from "./client";
import { API_BASE_URL, API_ENDPOINTS } from "./config";

// Types based on backend DTOs
export type LeaseStatus = 'PENDING' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

export interface LeaseResponseDTO {
  id: number;
  
  // Property
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  propertyCoverImageUrl: string | null;
  
  // Tenant
  tenantId: number;
  tenantName: string;
  tenantEmail: string;
  tenantAvatarUrl: string | null;
  
  // Landlord
  landlordId: number;
  landlordName: string;
  
  // Lease Details
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: LeaseStatus;
  
  // Contract
  contractFileId: number | null;
  contractFileUrl: string | null;
}

export interface CreateLeaseRequestDTO {
  approvedApplicationId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
}

export interface UploadLeaseContractDTO {
  contractDocumentId: number;
}

export const leaseApi = {
  // Create draft lease from approved application (Landlord/Manager)
  createLease: (data: CreateLeaseRequestDTO): Promise<LeaseResponseDTO> => {
    return api.post<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENTS, data);
  },

  // Get single lease by ID
  getLeaseById: (leaseId: number): Promise<LeaseResponseDTO> => {
    return api.get<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_DETAIL(leaseId));
  },

  // Get my leases (Tenant)
  getMyLeases: (): Promise<LeaseResponseDTO[]> => {
    return api.get<LeaseResponseDTO[]>(API_ENDPOINTS.LEASE_AGREEMENTS_MY);
  },

  // Get all leases for landlord/manager
  getLeasesForLandlord: (): Promise<LeaseResponseDTO[]> => {
    return api.get<LeaseResponseDTO[]>(API_ENDPOINTS.LEASE_AGREEMENTS_FOR_LANDLORD);
  },

  // Get leases for specific property
  getLeasesForProperty: (propertyId: number): Promise<LeaseResponseDTO[]> => {
    return api.get<LeaseResponseDTO[]>(API_ENDPOINTS.LEASE_AGREEMENTS_FOR_PROPERTY(propertyId));
  },

  // Attach contract document to lease
  attachContract: (leaseId: number, contractDocumentId: number): Promise<LeaseResponseDTO> => {
    const data: UploadLeaseContractDTO = { contractDocumentId };
    return api.patch<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_CONTRACT(leaseId), data);
  },

  // Activate pending lease
  activateLease: (leaseId: number): Promise<LeaseResponseDTO> => {
    return api.patch<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_ACTIVATE(leaseId), {});
  },

  // Terminate active lease
  terminateLease: (leaseId: number): Promise<LeaseResponseDTO> => {
    return api.patch<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_TERMINATE(leaseId), {});
  },
};
