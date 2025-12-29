import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { createConversation, getConversationByProperty } from '@/lib/mockDatabase';
import { toast } from 'sonner';

interface ContactLandlordProperty {
  id: string;
  title: string;
  landlord: {
    id: string;
    name: string;
    avatar: string;
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
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onClose?.();
    }
    onOpenChange?.(isOpen);
  };
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState(`Inquiry about ${property.title}`);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = () => {
    if (!user) return;
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);

    // Check if conversation already exists
    const existingConv = getConversationByProperty(user.id, property.id);
    if (existingConv) {
      toast.info('You already have a conversation about this property');
      handleClose(false);
      navigate('/dashboard/messages');
      return;
    }

    const fullMessage = `Subject: ${subject}\n\n${message}`;
    createConversation(
      user.id,
      property.landlord.id,
      property.landlord.name,
      property.landlord.avatar,
      property.id,
      property.title,
      fullMessage
    );

    toast.success('Message sent to landlord!');
    handleClose(false);
    navigate('/dashboard/messages');

    setIsSending(false);
  };

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
            <img
              src={property.landlord.avatar}
              alt={property.landlord.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{property.landlord.name}</p>
              <p className="text-sm text-muted-foreground">
                Usually responds {property.landlord.responseTime}
              </p>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject of your message"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              placeholder="Hi, I'm interested in this property and would like to learn more about..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSending || !message.trim()} className="flex-1">
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
