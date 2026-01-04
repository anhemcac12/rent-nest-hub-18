import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { conversationsApi } from '@/lib/api/conversationsApi';
import { toast } from 'sonner';

interface ContactLandlordProperty {
  id: string | number;
  title: string;
  landlord: {
    id: string | number;
    name: string;
    avatar?: string;
    responseRate?: number;
    responseTime?: string;
    propertiesCount?: number;
    verified?: boolean;
  };
}

interface ContactLandlordModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  property: ContactLandlordProperty;
}

export function ContactLandlordModal({ open, onOpenChange, onClose, property }: ContactLandlordModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState(`Inquiry about ${property.title}`);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [existingConversationId, setExistingConversationId] = useState<number | null>(null);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onClose?.();
      // Reset state
      setMessage('');
      setExistingConversationId(null);
    }
    onOpenChange?.(isOpen);
  };

  // Check for existing conversation when modal opens
  useEffect(() => {
    const checkExisting = async () => {
      if (!open || !user) return;
      
      try {
        setIsCheckingExisting(true);
        const propertyId = typeof property.id === 'string' ? parseInt(property.id) : property.id;
        const response = await conversationsApi.checkExistingConversation(propertyId);
        
        if (response.exists && response.conversationId) {
          setExistingConversationId(response.conversationId);
        }
      } catch (error) {
        console.error('Failed to check existing conversation:', error);
        // Don't show error - just proceed as if no existing conversation
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExisting();
  }, [open, property.id, user]);

  const handleGoToConversation = () => {
    handleClose(false);
    navigate(`/dashboard/messages/${existingConversationId}`);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to contact the landlord');
      return;
    }
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setIsSending(true);

    try {
      const propertyId = typeof property.id === 'string' ? parseInt(property.id) : property.id;
      
      const response = await conversationsApi.startConversation({
        propertyId,
        subject: subject.trim(),
        message: message.trim(),
      });

      toast.success('Message sent to landlord!');
      handleClose(false);
      navigate(`/dashboard/messages/${response.conversation.id}`);
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      
      // Handle specific error cases
      if (error.status === 409) {
        toast.error('You already have a conversation about this property');
        // Try to find the existing conversation
        try {
          const propertyId = typeof property.id === 'string' ? parseInt(property.id) : property.id;
          const checkResponse = await conversationsApi.checkExistingConversation(propertyId);
          if (checkResponse.exists && checkResponse.conversationId) {
            setExistingConversationId(checkResponse.conversationId);
          }
        } catch {
          // Ignore
        }
      } else if (error.status === 403) {
        toast.error('Only tenants can start conversations');
      } else {
        toast.error(error.message || 'Failed to send message');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Show loading state while checking for existing conversation
  if (isCheckingExisting) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show existing conversation prompt
  if (existingConversationId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Existing Conversation
            </DialogTitle>
            <DialogDescription>
              You already have an active conversation about this property
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Property Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{property.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                with {property.landlord.name}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Would you like to continue your existing conversation?
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleGoToConversation} className="flex-1">
              Go to Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Contact Landlord
          </DialogTitle>
          <DialogDescription>
            Send a message to {property.landlord.name} about {property.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Landlord Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={property.landlord.avatar} />
              <AvatarFallback>
                {property.landlord.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{property.landlord.name}</p>
              {property.landlord.responseTime && (
                <p className="text-sm text-muted-foreground">
                  Usually responds {property.landlord.responseTime}
                </p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject of your message"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm interested in this property and would like to learn more about..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleClose(false)} 
            className="flex-1"
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSending || !message.trim()} 
            className="flex-1"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
