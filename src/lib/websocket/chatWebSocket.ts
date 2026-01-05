import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { API_BASE_URL } from '@/lib/api/config';
import { MessageDTO } from '@/lib/api/conversationsApi';

// WebSocket URL - same base as REST but with /ws endpoint
const WS_URL = `${API_BASE_URL}/ws`;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketCallbacks {
  onMessage: (message: MessageDTO) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

class ChatWebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<number, StompSubscription> = new Map();
  private callbacks: WebSocketCallbacks | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(token: string, callbacks: WebSocketCallbacks): void {
    if (this.client?.connected) {
      console.log('[WS] Already connected');
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
        console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[WS] Connected successfully');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message']);
        this.setStatus('error');
        this.callbacks?.onError?.(new Error(frame.headers['message'] || 'STOMP error'));
      },
      onWebSocketClose: () => {
        console.log('[WS] Connection closed');
        if (this.connectionStatus === 'connected') {
          this.setStatus('disconnected');
        }
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected');
        this.setStatus('disconnected');
      },
    });

    this.client.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.client) {
      // Unsubscribe all
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      
      this.client.deactivate();
      this.client = null;
    }
    this.setStatus('disconnected');
    this.callbacks = null;
  }

  /**
   * Subscribe to a conversation for real-time messages
   */
  subscribeToConversation(conversationId: number): void {
    if (!this.client?.connected) {
      console.warn('[WS] Cannot subscribe - not connected');
      return;
    }

    // Already subscribed
    if (this.subscriptions.has(conversationId)) {
      console.log(`[WS] Already subscribed to conversation ${conversationId}`);
      return;
    }

    const destination = `/topic/conversations/${conversationId}`;
    console.log(`[WS] Subscribing to ${destination}`);

    const subscription = this.client.subscribe(destination, (msg: IMessage) => {
      try {
        const message: MessageDTO = JSON.parse(msg.body);
        console.log('[WS] Received message:', message);
        this.callbacks?.onMessage(message);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    });

    this.subscriptions.set(conversationId, subscription);
  }

  /**
   * Unsubscribe from a conversation
   */
  unsubscribeFromConversation(conversationId: number): void {
    const subscription = this.subscriptions.get(conversationId);
    if (subscription) {
      console.log(`[WS] Unsubscribing from conversation ${conversationId}`);
      subscription.unsubscribe();
      this.subscriptions.delete(conversationId);
    }
  }

  /**
   * Send a message via WebSocket
   * Returns true if sent successfully, false otherwise
   */
  sendMessage(conversationId: number, content: string): boolean {
    if (!this.client?.connected) {
      console.warn('[WS] Cannot send - not connected');
      return false;
    }

    try {
      this.client.publish({
        destination: `/app/chat.send/${conversationId}`,
        body: JSON.stringify({ content }),
      });
      console.log('[WS] Message sent via WebSocket');
      return true;
    } catch (error) {
      console.error('[WS] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Mark conversation as read via WebSocket
   */
  markAsRead(conversationId: number): void {
    if (!this.client?.connected) {
      console.warn('[WS] Cannot mark as read - not connected');
      return;
    }

    try {
      this.client.publish({
        destination: `/app/chat.read/${conversationId}`,
        body: '',
      });
      console.log('[WS] Marked as read via WebSocket');
    } catch (error) {
      console.error('[WS] Failed to mark as read:', error);
    }
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
export const chatWebSocket = new ChatWebSocketService();

export default chatWebSocket;
