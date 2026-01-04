import { api } from './client';
import { API_BASE_URL } from './config';

// ============= Types =============

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED';
export type SenderRole = 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER';

export interface ParticipantDTO {
  userId: number;
  fullName: string;
  avatar: string | null;
  role: SenderRole;
}

export interface MessageDTO {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: SenderRole;
  content: string;
  isOwn: boolean;
  read: boolean;
  createdAt: string;
}

export interface ConversationListItemDTO {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage: string | null;
  subject: string;
  status: ConversationStatus;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderRole: SenderRole;
  unreadCount: number;
  participants: ParticipantDTO[];
  createdAt: string;
}

export interface ConversationDetailDTO {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage: string | null;
  propertyAddress: string;
  subject: string;
  status: ConversationStatus;
  tenant: ParticipantDTO;
  landlord: ParticipantDTO;
  propertyManagers: ParticipantDTO[];
  currentUserRole: SenderRole;
  messages: MessageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface StartConversationRequest {
  propertyId: number;
  subject: string;
  message: string;
}

export interface StartConversationResponse {
  conversation: ConversationListItemDTO;
  message: MessageDTO;
}

export interface SendMessageRequest {
  content: string;
}

export interface MarkReadResponse {
  markedAsRead: number;
  conversationId: number;
}

export interface ConversationExistsResponse {
  exists: boolean;
  conversationId: number | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
  unreadConversations: number;
}

export interface PaginatedConversations {
  content: ConversationListItemDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ============= API Functions =============

const CONVERSATIONS_BASE = `${API_BASE_URL}/api/conversations`;

/**
 * Get all conversations for the current user
 */
export async function getConversations(
  status: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE',
  page: number = 0,
  size: number = 20
): Promise<PaginatedConversations> {
  const params = new URLSearchParams({
    status,
    page: page.toString(),
    size: size.toString(),
  });
  return api.get<PaginatedConversations>(`/api/conversations?${params}`);
}

/**
 * Get a single conversation with all messages
 */
export async function getConversation(conversationId: number): Promise<ConversationDetailDTO> {
  return api.get<ConversationDetailDTO>(`/api/conversations/${conversationId}`);
}

/**
 * Start a new conversation (Tenant only)
 */
export async function startConversation(
  request: StartConversationRequest
): Promise<StartConversationResponse> {
  return api.post<StartConversationResponse>('/api/conversations', request);
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: number,
  content: string
): Promise<MessageDTO> {
  return api.post<MessageDTO>(`/api/conversations/${conversationId}/messages`, { content });
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(conversationId: number): Promise<MarkReadResponse> {
  return api.patch<MarkReadResponse>(`/api/conversations/${conversationId}/read`, {});
}

/**
 * Check if a conversation exists for a property (Tenant only)
 */
export async function checkExistingConversation(
  propertyId: number
): Promise<ConversationExistsResponse> {
  return api.get<ConversationExistsResponse>(`/api/conversations/property/${propertyId}`);
}

/**
 * Get global unread count for header badge
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return api.get<UnreadCountResponse>('/api/conversations/unread-count');
}

/**
 * Delete (archive) a conversation
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  return api.delete(`/api/conversations/${conversationId}`);
}

// ============= Helper Functions =============

/**
 * Get display name for the other party in a conversation
 */
export function getOtherPartyName(
  conversation: ConversationListItemDTO | ConversationDetailDTO,
  currentUserRole: SenderRole
): string {
  if ('tenant' in conversation) {
    // ConversationDetailDTO
    if (currentUserRole === 'TENANT') {
      return conversation.landlord.fullName;
    }
    return conversation.tenant.fullName;
  }
  
  // ConversationListItemDTO
  const otherParticipant = conversation.participants.find(
    p => p.role !== currentUserRole
  );
  return otherParticipant?.fullName || 'Unknown';
}

/**
 * Get avatar for the other party in a conversation
 */
export function getOtherPartyAvatar(
  conversation: ConversationListItemDTO | ConversationDetailDTO,
  currentUserRole: SenderRole
): string | null {
  if ('tenant' in conversation) {
    if (currentUserRole === 'TENANT') {
      return conversation.landlord.avatar;
    }
    return conversation.tenant.avatar;
  }
  
  const otherParticipant = conversation.participants.find(
    p => p.role !== currentUserRole
  );
  return otherParticipant?.avatar || null;
}

/**
 * Format sender role for display
 */
export function formatSenderRole(role: SenderRole): string {
  switch (role) {
    case 'TENANT':
      return 'Tenant';
    case 'LANDLORD':
      return 'Landlord';
    case 'PROPERTY_MANAGER':
      return 'Property Manager';
    default:
      return role;
  }
}

export const conversationsApi = {
  getConversations,
  getConversation,
  startConversation,
  sendMessage,
  markConversationAsRead,
  checkExistingConversation,
  getUnreadCount,
  deleteConversation,
  getOtherPartyName,
  getOtherPartyAvatar,
  formatSenderRole,
};

export default conversationsApi;
