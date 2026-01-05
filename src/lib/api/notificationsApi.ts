import { api } from './client';
import { API_ENDPOINTS } from './config';

// Types matching backend response
export type NotificationType = 'APPLICATION' | 'LEASE' | 'MAINTENANCE' | 'MESSAGE' | 'PAYMENT' | 'PROPERTY' | 'SYSTEM';
export type RelatedEntityType = 'LEASE_APPLICATION' | 'LEASE_AGREEMENT' | 'MAINTENANCE_REQUEST' | 'CONVERSATION' | 'PAYMENT' | 'PROPERTY' | 'USER';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
  link?: string;
  relatedEntityId?: number;
  relatedEntityType?: RelatedEntityType;
  createdAt: string;
}

export interface NotificationsResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllReadResponse {
  message: string;
  count: number;
}

export interface DeleteAllReadResponse {
  message: string;
  count: number;
}

export interface GetNotificationsParams {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
  type?: NotificationType | NotificationType[];
}

export const notificationsApi = {
  /**
   * Get paginated notifications with optional filters
   */
  getNotifications: async (params: GetNotificationsParams = {}): Promise<NotificationsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly.toString());
    if (params.type) {
      const types = Array.isArray(params.type) ? params.type.join(',') : params.type;
      queryParams.append('type', types);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.NOTIFICATIONS}?${queryString}` 
      : API_ENDPOINTS.NOTIFICATIONS;
    
    return api.get<NotificationsResponse>(endpoint);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return api.get<UnreadCountResponse>(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: number): Promise<Notification> => {
    return api.patch<Notification>(API_ENDPOINTS.NOTIFICATION_MARK_READ(notificationId));
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<MarkAllReadResponse> => {
    return api.patch<MarkAllReadResponse>(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
  },

  /**
   * Delete a single notification
   */
  deleteNotification: async (notificationId: number): Promise<void> => {
    return api.delete<void>(API_ENDPOINTS.NOTIFICATION_DELETE(notificationId));
  },

  /**
   * Delete all read notifications
   */
  deleteAllRead: async (): Promise<DeleteAllReadResponse> => {
    return api.delete<DeleteAllReadResponse>(API_ENDPOINTS.NOTIFICATIONS_DELETE_READ);
  },
};
