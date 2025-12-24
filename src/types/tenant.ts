import { Property } from './property';

export interface Tenant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences: {
    emailNotifications: boolean;
    smsAlerts: boolean;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Rental {
  id: string;
  propertyId: string;
  property: Property;
  tenantId: string;
  landlordId: string;
  status: 'active' | 'past' | 'upcoming';
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  securityDeposit: number;
  paymentDay: number; // Day of month rent is due
  createdAt: string;
}

export interface Application {
  id: string;
  propertyId: string;
  property: Property;
  tenantId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  documents: string[];
  timeline: ApplicationEvent[];
}

export interface ApplicationEvent {
  id: string;
  status: Application['status'];
  message: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  rentalId: string;
  propertyTitle: string;
  amount: number;
  type: 'rent' | 'deposit' | 'fee' | 'utility';
  status: 'paid' | 'pending' | 'overdue' | 'scheduled';
  dueDate: string;
  paidAt?: string;
  method?: string;
  receiptUrl?: string;
}

export interface Conversation {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordAvatar: string;
  propertyId: string;
  propertyTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'tenant' | 'landlord';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface MaintenanceRequest {
  id: string;
  rentalId: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'accepted' | 'rejected' | 'in_progress' | 'scheduled' | 'completed';
  images?: string[];
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  completedAt?: string;
  resolvedAt?: string;
  notes?: string;
  rejectionReason?: string;
  timeline: MaintenanceEvent[];
}

export interface MaintenanceEvent {
  id: string;
  status: MaintenanceRequest['status'];
  message: string;
  timestamp: string;
  actor?: 'tenant' | 'landlord' | 'system';
}

export interface Document {
  id: string;
  name: string;
  type: 'lease' | 'receipt' | 'maintenance' | 'other';
  fileType: 'pdf' | 'doc' | 'docx' | 'jpg' | 'png';
  propertyId?: string;
  propertyTitle?: string;
  uploadedAt: string;
  size: number; // in bytes
  url: string;
}

export interface ActivityItem {
  id: string;
  type: 'payment' | 'message' | 'maintenance' | 'application' | 'document';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'application' | 'message' | 'property' | 'payment' | 'maintenance' | 'system';
  title: string;
  description: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
