import { useState } from 'react';
import { CalendarIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { leaseApplicationApi } from '@/lib/api/leaseApplicationApi';
import { ApiError } from '@/lib/api/client';
import { toast } from 'sonner';

interface ApplyLeaseProperty {
  id: string | number;
  title: string;
  price: number;
  thumbnail?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
}

interface ApplyLeaseModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  property: ApplyLeaseProperty;
  onSuccess?: () => void;
}

export function ApplyLeaseModal({ open, onOpenChange, onClose, property, onSuccess }: ApplyLeaseModalProps) {
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onClose?.();
    }
    onOpenChange?.(isOpen);
  };
  const { user } = useAuth();
  const [moveInDate, setMoveInDate] = useState<Date>();
  const [message, setMessage] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to apply');
      return;
    }
    if (!moveInDate) {
      toast.error('Please select a preferred move-in date');
      return;
    }
    if (!employmentStatus) {
      toast.error('Please select your employment status');
      return;
    }
    if (!agreed) {
      toast.error('Please agree to the terms');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullMessage = `Preferred move-in: ${format(moveInDate, 'PPP')}\nEmployment: ${employmentStatus}\n\n${message}`;
      
      await leaseApplicationApi.createApplication({
        propertyId: Number(property.id),
        message: fullMessage,
      });

      toast.success('Application submitted successfully!');
      handleClose(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to submit application');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Apply for Lease
          </DialogTitle>
          <DialogDescription>
            Submit your application for {property.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Property Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <img
              src={property.thumbnail || '/placeholder.svg'}
              alt={property.title}
              className="w-16 h-12 object-cover rounded"
            />
            <div>
              <p className="font-medium text-sm">{property.title}</p>
              <p className="text-lg font-bold text-primary">
                ${property.price.toLocaleString()}/month
              </p>
            </div>
          </div>

          {/* Move-in Date */}
          <div className="space-y-2">
            <Label>Preferred Move-in Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !moveInDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {moveInDate ? format(moveInDate, 'PPP') : 'Select a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={moveInDate}
                  onSelect={setMoveInDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Employment Status */}
          <div className="space-y-2">
            <Label>Employment Status *</Label>
            <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select your employment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed Full-time</SelectItem>
                <SelectItem value="part-time">Employed Part-time</SelectItem>
                <SelectItem value="self-employed">Self-employed</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message to Landlord (Optional)</Label>
            <Textarea
              placeholder="Introduce yourself, mention your rental history, or ask any questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Agreement */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <Label htmlFor="agree" className="text-sm text-muted-foreground leading-tight">
              I confirm that the information provided is accurate and I agree to be contacted by
              the landlord regarding this application.
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
