import { useState, useEffect, useRef } from 'react';
import { Send, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { getLandlordConversations, addMessageToConversation, getUsers } from '@/lib/mockDatabase';
import { Conversation, Message } from '@/types/tenant';
import { cn } from '@/lib/utils';
import { User } from '@/types/user';

export default function LandlordMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const convs = getLandlordConversations(user.id);
      setConversations(convs);
      setUsers(getUsers());
      if (convs.length > 0 && !selectedConv) {
        setSelectedConv(convs[0]);
      }
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const getTenantInfo = (tenantId: string) => {
    // The tenant is the person who initiated the conversation (first message sender)
    // In landlord conversations, we need to find the tenant
    const tenant = users.find(u => u.id === tenantId);
    return tenant;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConv || !user) return;

    const updatedConv = addMessageToConversation(
      selectedConv.id,
      user.id,
      'landlord',
      newMessage.trim()
    );

    if (updatedConv) {
      setSelectedConv(updatedConv);
      setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Find the tenant ID from the conversation (the non-landlord participant)
  const getConversationTenantId = (conv: Conversation) => {
    // The first message sender should be the tenant
    const firstMessage = conv.messages[0];
    if (firstMessage && firstMessage.senderType === 'tenant') {
      return firstMessage.senderId;
    }
    return null;
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
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <CardContent className="pt-0">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => {
                    const tenantId = getConversationTenantId(conv);
                    const tenant = tenantId ? getTenantInfo(tenantId) : null;
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv)}
                        className={cn(
                          'w-full p-3 rounded-lg text-left transition-colors',
                          selectedConv?.id === conv.id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={tenant?.avatar} />
                          <AvatarFallback>
                              {tenant?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">
                                {tenant?.fullName || 'Unknown Tenant'}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.propertyTitle}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              {/* Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {(() => {
                        const tenantId = getConversationTenantId(selectedConv);
                        const tenant = tenantId ? getTenantInfo(tenantId) : null;
                        return tenant?.fullName || 'Unknown Tenant';
                      })()}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{selectedConv.propertyTitle}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConv.messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg px-4 py-2',
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={cn(
                            'text-xs mt-1',
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
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
