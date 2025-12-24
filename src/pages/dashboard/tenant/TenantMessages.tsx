import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Send, Paperclip, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { mockConversations } from '@/data/mockTenant';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Conversation, Message } from '@/types/tenant';

function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
            selectedId === conv.id
              ? 'bg-primary/10'
              : 'hover:bg-muted'
          )}
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={conv.landlordAvatar} />
            <AvatarFallback>{conv.landlordName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium truncate">{conv.landlordName}</p>
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
      ))}
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        <p className="text-sm">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {format(parseISO(message.timestamp), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}

function MessageThread({
  conversation,
  tenantId,
  onSendMessage,
}: {
  conversation: Conversation;
  tenantId: string;
  onSendMessage: (content: string) => void;
}) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
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
          <AvatarImage src={conversation.landlordAvatar} />
          <AvatarFallback>{conversation.landlordName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{conversation.landlordName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {conversation.propertyTitle}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === tenantId}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TenantMessages() {
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(id || mockConversations[0]?.id || null);
  const [conversations, setConversations] = useState(mockConversations);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const handleSendMessage = (content: string) => {
    if (!selectedConversation || !user) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: user.id,
      senderType: 'tenant',
      content,
      timestamp: new Date().toISOString(),
      read: true,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: content,
              lastMessageAt: newMessage.timestamp,
            }
          : conv
      )
    );

    toast.success('Message sent');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with your landlords
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length > 0 ? (
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No conversations yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation && user ? (
            <MessageThread
              conversation={selectedConversation}
              tenantId={user.id}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
