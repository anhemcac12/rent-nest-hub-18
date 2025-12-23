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
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'active' | 'expired' | 'terminated';
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
