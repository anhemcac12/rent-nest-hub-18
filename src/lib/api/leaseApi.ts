import { api } from "./client";
import { API_ENDPOINTS } from "./config";

// Types based on backend DTOs
export type LeaseStatus = 'PENDING' | 'AWAITING_PAYMENT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

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
  securityDeposit: number;
  status: LeaseStatus;
  
  // Contract
  contractFileId: number | null;
  contractFileUrl: string | null;
  
  // Acceptance/Rejection fields
  acceptedAt: string | null;
  acceptanceDeadline: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  terminationReason: string | null;
  
  // Payment tracking
  depositPaid: boolean;
  firstRentPaid: boolean;
  totalDueOnAcceptance: number;
  totalPaidOnAcceptance: number;
}

export interface CreateLeaseRequestDTO {
  approvedApplicationId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
}

export interface UploadLeaseContractDTO {
  contractDocumentId: number;
}

export interface TenantAcceptLeaseDTO {
  agreedToTerms: boolean;
}

export interface TenantRejectLeaseDTO {
  reason: string;
}

export interface DeadlineStatusDTO {
  leaseId: number;
  status: string;
  acceptedAt: string | null;
  deadline: string | null;
  currentTime: string;
  hoursRemaining: number | null;
  isExpired: boolean;
  willAutoTerminateAt: string | null;
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

  // Tenant accepts lease
  acceptLease: (leaseId: number, agreedToTerms: boolean = true): Promise<LeaseResponseDTO> => {
    const data: TenantAcceptLeaseDTO = { agreedToTerms };
    return api.patch<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_ACCEPT(leaseId), data);
  },

  // Tenant rejects lease
  rejectLease: (leaseId: number, reason: string): Promise<LeaseResponseDTO> => {
    const data: TenantRejectLeaseDTO = { reason };
    return api.patch<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_REJECT(leaseId), data);
  },

  // Get deadline status
  getDeadlineStatus: (leaseId: number): Promise<DeadlineStatusDTO> => {
    return api.get<DeadlineStatusDTO>(API_ENDPOINTS.LEASE_AGREEMENT_DEADLINE_STATUS(leaseId));
  },

  // Activate pending lease (manual backup)
  activateLease: (leaseId: number): Promise<LeaseResponseDTO> => {
    return api.patch<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_ACTIVATE(leaseId), {});
  },

  // Terminate active lease
  terminateLease: (leaseId: number): Promise<LeaseResponseDTO> => {
    return api.patch<LeaseResponseDTO>(API_ENDPOINTS.LEASE_AGREEMENT_TERMINATE(leaseId), {});
  },
};
