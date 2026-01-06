import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { TOKEN_KEY } from '@/lib/api/config';
import { notificationWebSocket, ConnectionStatus } from '@/lib/websocket/notificationWebSocket';
import { Notification, NotificationType, notificationsApi } from '@/lib/api/notificationsApi';
import { toast } from 'sonner';

interface RealtimeContextType {
  // Notification state
  notifications: Notification[];
  unreadCount: number;
  connectionStatus: ConnectionStatus;
  
  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  
  // Subscription for data refresh triggers
  subscribeToRefresh: (types: NotificationType[], callback: () => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  // Store refresh callbacks by notification type
  const refreshCallbacksRef = useRef<Map<NotificationType, Set<() => void>>>(new Map());

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const [notifResponse, countResponse] = await Promise.all([
        notificationsApi.getNotifications({ size: 10 }),
        notificationsApi.getUnreadCount(),
      ]);
      
      setNotifications(notifResponse.content);
      setUnreadCount(countResponse.count);
    } catch (error) {
      console.error('[Realtime] Failed to fetch notifications:', error);
    }
  }, [isAuthenticated]);

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('[Realtime] New notification received via WebSocket:', notification);
    
    // Show toast notification immediately
    toast(notification.title, {
      description: notification.description,
      duration: 5000,
    });
    
    // Add to notifications list immediately (optimistic update)
    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev.slice(0, 9)];
    });
    setUnreadCount(prev => prev + 1);
    
    // Trigger refresh callbacks for this notification type
    const callbacks = refreshCallbacksRef.current.get(notification.type);
    if (callbacks) {
      console.log(`[Realtime] Triggering ${callbacks.size} refresh callbacks for ${notification.type}`);
      callbacks.forEach(cb => cb());
    }
  }, []);

  // Subscribe to refresh triggers by notification type
  const subscribeToRefresh = useCallback((types: NotificationType[], callback: () => void) => {
    types.forEach(type => {
      if (!refreshCallbacksRef.current.has(type)) {
        refreshCallbacksRef.current.set(type, new Set());
      }
      refreshCallbacksRef.current.get(type)!.add(callback);
    });

    // Return unsubscribe function
    return () => {
      types.forEach(type => {
        refreshCallbacksRef.current.get(type)?.delete(callback);
      });
    };
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Realtime] Failed to mark as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[Realtime] Failed to mark all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[Realtime] Failed to delete notification:', error);
    }
  }, [notifications]);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      notificationWebSocket.disconnect();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.warn('[Realtime] No token available');
      return;
    }

    // Initial fetch
    refreshNotifications();

    // Connect to WebSocket
    notificationWebSocket.connect(token, {
      onNotification: handleNewNotification,
      onStatusChange: setConnectionStatus,
      onError: (error) => {
        console.error('[Realtime] WebSocket error:', error);
      },
    });

    return () => {
      notificationWebSocket.disconnect();
    };
  }, [isAuthenticated, user, handleNewNotification, refreshNotifications]);

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionStatus,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        subscribeToRefresh,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Hook for subscribing to data refresh based on notification types
export function useRealtimeRefresh(types: NotificationType[], refetchFn: () => void) {
  const { subscribeToRefresh } = useRealtime();
  
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(types, refetchFn);
    return unsubscribe;
  }, [types, refetchFn, subscribeToRefresh]);
}
