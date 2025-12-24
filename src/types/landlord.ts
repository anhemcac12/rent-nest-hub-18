import { Property } from './property';

export interface PropertyManager {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: 'manager' | 'assistant';
  addedAt: string;
}

export interface LeaseDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
  uploadedAt: string;
}

export interface LeaseAgreement {
  id: string;
  applicationId: string;
  propertyId: string;
  property: Property;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantAvatar?: string;
  landlordId: string;
  
  // Lease Terms
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  
  // Documents
  documents: LeaseDocument[];
  
  // Status Flow
  status: 'draft' | 'pending_tenant' | 'tenant_accepted' | 'payment_pending' | 'active' | 'rejected' | 'expired' | 'terminated';
  
  // Payment tracking
  paymentStatus?: 'unpaid' | 'paid' | 'processing';
  paymentAmount?: number;
  paidAt?: string;
  
  // Rejection reason (if tenant rejects)
  rejectionReason?: string;
  
  // Timestamps
  sentToTenantAt?: string;
  tenantRespondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
