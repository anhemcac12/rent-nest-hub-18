// UI Lease type that maps from backend LeaseResponseDTO
export type LeaseStatus = 'PENDING' | 'AWAITING_PAYMENT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

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

// Helper to get display status
export function getLeaseStatusDisplay(status: LeaseStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending Review';
    case 'AWAITING_PAYMENT':
      return 'Awaiting Payment';
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

// Helper to get status color class
export function getLeaseStatusColor(status: LeaseStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-500';
    case 'AWAITING_PAYMENT':
      return 'bg-blue-500';
    case 'ACTIVE':
      return 'bg-green-500';
    case 'TERMINATED':
      return 'bg-red-500';
    case 'EXPIRED':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}
