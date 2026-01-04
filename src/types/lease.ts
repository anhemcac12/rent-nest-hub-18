// UI Lease type that maps from backend LeaseResponseDTO
export type LeaseStatus = 'PENDING' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

export interface Lease {
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

// Helper to get display status
export function getLeaseStatusDisplay(status: LeaseStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACTIVE':
      return 'Active';
    case 'TERMINATED':
      return 'Terminated';
    case 'EXPIRED':
      return 'Expired';
    default:
      return status;
  }
}
