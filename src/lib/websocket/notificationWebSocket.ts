import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { API_BASE_URL } from '@/lib/api/config';
import { Notification, NotificationType } from '@/lib/api/notificationsApi';

const WS_URL = `${API_BASE_URL}/ws`;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NotificationWebSocketCallbacks {
  onNotification: (notification: Notification) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

class NotificationWebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private callbacks: NotificationWebSocketCallbacks | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';

  /**
   * Connect to WebSocket server for notifications
   */
  connect(token: string, callbacks: NotificationWebSocketCallbacks): void {
    if (this.client?.connected) {
      console.log('[NotificationWS] Already connected');
      return;
    }

    this.callbacks = callbacks;
    this.setStatus('connecting');

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // Log all important STOMP events for debugging
        console.log('[NotificationWS]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[NotificationWS] Connected successfully');
        this.setStatus('connected');
        this.subscribeToNotifications();
      },
      onStompError: (frame) => {
        console.error('[NotificationWS] STOMP error:', frame.headers['message']);
        this.setStatus('error');
        this.callbacks?.onError?.(new Error(frame.headers['message'] || 'STOMP error'));
      },
      onWebSocketClose: () => {
        console.log('[NotificationWS] Connection closed');
        if (this.connectionStatus === 'connected') {
          this.setStatus('disconnected');
        }
      },
      onDisconnect: () => {
        console.log('[NotificationWS] Disconnected');
        this.setStatus('disconnected');
      },
    });

    this.client.activate();
  }

  /**
   * Subscribe to user-specific notification queue
   */
  private subscribeToNotifications(): void {
    if (!this.client?.connected) {
      console.warn('[NotificationWS] Cannot subscribe - not connected');
      return;
    }

    // Subscribe to user-specific queue
    const destination = '/user/queue/notifications';
    console.log(`[NotificationWS] Subscribing to ${destination}`);

    this.subscription = this.client.subscribe(destination, (msg: IMessage) => {
      try {
        const notification: Notification = JSON.parse(msg.body);
        console.log('[NotificationWS] Received notification:', notification);
        this.callbacks?.onNotification(notification);
      } catch (error) {
        console.error('[NotificationWS] Failed to parse notification:', error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.setStatus('disconnected');
    this.callbacks = null;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && !!this.client?.connected;
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.callbacks?.onStatusChange(status);
  }
}

// Export singleton instance
export const notificationWebSocket = new NotificationWebSocketService();

export default notificationWebSocket;
