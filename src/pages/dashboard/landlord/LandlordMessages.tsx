import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Send, Building2, MessageSquare, Loader2, Users, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  conversationsApi,
  ConversationListItemDTO,
  ConversationDetailDTO,
  MessageDTO,
} from '@/lib/api/conversationsApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';

function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: {
  conversations: ConversationListItemDTO[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Tenants will contact you about your properties
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const tenant = conv.participants.find(p => p.role === 'TENANT');
        
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
              selectedId === conv.id
                ? 'bg-primary/10 border border-primary/20'
                : 'hover:bg-muted'
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={tenant?.avatar || undefined} />
              <AvatarFallback>
                {tenant?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'TN'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{tenant?.fullName || 'Tenant'}</p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(parseISO(conv.lastMessageAt), 'MMM d')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {conv.propertyTitle}
              </p>
              <p className="text-sm text-muted-foreground truncate mt-1">
                {conv.lastMessage}
              </p>
            </div>
            {conv.unreadCount > 0 && (
              <Badge className="shrink-0 h-5 w-5 p-0 flex items-center justify-center">
                {conv.unreadCount}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MessageBubble({ message }: { message: MessageDTO }) {
  return (
    <div className={cn('flex', message.isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          message.isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {!message.isOwn && (
          <p className={cn(
            'text-xs font-medium mb-1',
            message.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            {message.senderName}
            {message.senderRole === 'PROPERTY_MANAGER' && (
              <span className="ml-1 text-[10px]">(Manager)</span>
            )}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            message.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {format(parseISO(message.createdAt), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}

function MessageThread({
  conversation,
  onSendMessage,
  isSending,
  isConnected,
}: {
  conversation: ConversationDetailDTO;
  onSendMessage: (content: string) => void;
  isSending: boolean;
  isConnected: boolean;
}) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.messages]);

  const handleSend = () => {
    if (!newMessage.trim() || isSending) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.tenant.avatar || undefined} />
          <AvatarFallback>
            {conversation.tenant.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{conversation.tenant.fullName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3 shrink-0" />
            {conversation.propertyTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversation.propertyManagers.length > 0 && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {conversation.propertyManagers.length} manager{conversation.propertyManagers.length > 1 ? 's' : ''}
            </Badge>
          )}
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Subject */}
      {conversation.subject && (
        <div className="px-4 py-2 bg-muted/50 border-b">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Subject:</span> {conversation.subject}
          </p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LandlordMessages() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItemDTO[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(id ? parseInt(id) : null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetailDTO | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Handle incoming WebSocket messages
  const handleNewMessage = useCallback((message: MessageDTO) => {
    if (message.conversationId === selectedId) {
      setSelectedConversation(prev => {
        if (!prev) return null;
        if (prev.messages.some(m => m.id === message.id)) {
          return prev;
        }
        return {
          ...prev,
          messages: [...prev.messages, message],
        };
      });
    }

    setConversations(prev =>
      prev.map(c =>
        c.id === message.conversationId
          ? {
              ...c,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              lastMessageSenderRole: message.senderRole,
              unreadCount: message.conversationId === selectedId ? 0 : c.unreadCount + 1,
            }
          : c
      )
    );
  }, [selectedId]);

  // WebSocket hook
  const { isConnected, sendMessage, markAsRead } = useChatWebSocket({
    conversationId: selectedId,
    onNewMessage: handleNewMessage,
    enabled: !!user,
  });

  // Fetch conversations list
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoadingList(true);
        const response = await conversationsApi.getConversations('ACTIVE');
        setConversations(response.content);
        
        if (!selectedId && response.content.length > 0) {
          setSelectedId(response.content[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setIsLoadingList(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Fetch selected conversation detail
  useEffect(() => {
    const fetchConversationDetail = async () => {
      if (!selectedId) {
        setSelectedConversation(null);
        return;
      }

      try {
        setIsLoadingDetail(true);
        const detail = await conversationsApi.getConversation(selectedId);
        setSelectedConversation(detail);
        
        const conv = conversations.find(c => c.id === selectedId);
        if (conv && conv.unreadCount > 0) {
          markAsRead();
          setConversations(prev => 
            prev.map(c => c.id === selectedId ? { ...c, unreadCount: 0 } : c)
          );
        }
      } catch (error) {
        console.error('Failed to fetch conversation:', error);
        toast.error('Failed to load conversation');
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchConversationDetail();
  }, [selectedId, markAsRead]);

  const handleSendMessage = async (content: string) => {
    if (!selectedId) return;

    try {
      setIsSending(true);
      const success = await sendMessage(content);
      
      if (!success) {
        const newMessage = await conversationsApi.sendMessage(selectedId, content);
        handleNewMessage(newMessage);
      }

      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with tenants interested in your properties
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-220px)]">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <CardContent className="pt-0">
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
                isLoading={isLoadingList}
              />
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          {isLoadingDetail ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          ) : selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              isConnected={isConnected}
            />
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                <p className="text-muted-foreground">
                  Select a conversation from the list to view messages
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
