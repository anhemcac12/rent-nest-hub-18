import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatWebSocket, ConnectionStatus } from '@/lib/websocket/chatWebSocket';
import { MessageDTO, conversationsApi } from '@/lib/api/conversationsApi';
import { TOKEN_KEY } from '@/lib/api/config';

interface UseChatWebSocketOptions {
  conversationId: number | null;
  onNewMessage?: (message: MessageDTO) => void;
  enabled?: boolean;
}

interface UseChatWebSocketReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  sendMessage: (content: string) => Promise<boolean>;
  markAsRead: () => void;
}

export function useChatWebSocket({
  conversationId,
  onNewMessage,
  enabled = true,
}: UseChatWebSocketOptions): UseChatWebSocketReturn {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const onNewMessageRef = useRef(onNewMessage);
  const previousConversationId = useRef<number | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!user || !enabled) {
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.warn('[useChatWebSocket] No token available');
      return;
    }

    // Connect with callbacks
    chatWebSocket.connect(token, {
      onMessage: (message) => {
        console.log('[useChatWebSocket] New message received:', message);
        onNewMessageRef.current?.(message);
      },
      onStatusChange: (status) => {
        console.log('[useChatWebSocket] Status changed:', status);
        setConnectionStatus(status);
      },
      onError: (error) => {
        console.error('[useChatWebSocket] Error:', error);
      },
    });

    return () => {
      chatWebSocket.disconnect();
    };
  }, [user, enabled]);

  // Subscribe to conversation when selected
  useEffect(() => {
    if (!conversationId || connectionStatus !== 'connected') {
      return;
    }

    // Unsubscribe from previous conversation
    if (previousConversationId.current && previousConversationId.current !== conversationId) {
      chatWebSocket.unsubscribeFromConversation(previousConversationId.current);
    }

    // Subscribe to new conversation
    chatWebSocket.subscribeToConversation(conversationId);
    previousConversationId.current = conversationId;

    return () => {
      if (conversationId) {
        chatWebSocket.unsubscribeFromConversation(conversationId);
      }
    };
  }, [conversationId, connectionStatus]);

  // Send message with fallback to REST API
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!conversationId) {
      console.warn('[useChatWebSocket] No conversation selected');
      return false;
    }

    // Try WebSocket first
    if (chatWebSocket.isConnected()) {
      const sent = chatWebSocket.sendMessage(conversationId, content);
      if (sent) {
        return true;
      }
    }

    // Fallback to REST API
    console.log('[useChatWebSocket] Falling back to REST API');
    try {
      const message = await conversationsApi.sendMessage(conversationId, content);
      // Manually trigger the callback since we used REST
      onNewMessageRef.current?.(message);
      return true;
    } catch (error) {
      console.error('[useChatWebSocket] REST fallback failed:', error);
      return false;
    }
  }, [conversationId]);

  // Mark as read
  const markAsRead = useCallback(() => {
    if (!conversationId) return;

    if (chatWebSocket.isConnected()) {
      chatWebSocket.markAsRead(conversationId);
    } else {
      // Fallback to REST API
      conversationsApi.markConversationAsRead(conversationId).catch(console.error);
    }
  }, [conversationId]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    sendMessage,
    markAsRead,
  };
}

export default useChatWebSocket;
