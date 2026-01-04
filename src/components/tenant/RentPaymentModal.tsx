import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CreditCard, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { paymentApi, RentScheduleItemDTO } from '@/lib/api/paymentApi';
import { LeaseResponseDTO } from '@/lib/api/leaseApi';
import { toast } from 'sonner';

interface RentPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: LeaseResponseDTO;
  rentItem: RentScheduleItemDTO;
  onPaymentComplete: () => void;
}

export function RentPaymentModal({
  open,
  onOpenChange,
  lease,
  rentItem,
  onPaymentComplete,
}: RentPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);

  const amountDue = rentItem.amountDue - rentItem.amountPaid;
  const isOverdue = rentItem.status === 'OVERDUE';
  const hasLateFee = rentItem.lateFeeApplied && rentItem.lateFeeAmount;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await paymentApi.payRent(lease.id, rentItem.id, {
        amount: amountDue,
        paymentMethod,
      });
      
      toast.success('Payment successful!');
      onPaymentComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Rent
          </DialogTitle>
          <DialogDescription>
            {lease.propertyTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Period */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rent Period</span>
              <Badge 
                variant="secondary" 
                className={isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}
              >
                {isOverdue ? 'Overdue' : 'Due'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {format(parseISO(rentItem.periodStart), 'MMM d, yyyy')} – {format(parseISO(rentItem.periodEnd), 'MMM d, yyyy')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              30-day period • Due on {format(parseISO(rentItem.dueDate), 'MMM d, yyyy')}
            </p>
          </div>

          {/* Overdue Warning */}
          {isOverdue && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Payment is overdue</p>
                {rentItem.daysOverdue && (
                  <p className="text-xs opacity-80">{rentItem.daysOverdue} days past due date</p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Payment Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span>${lease.rentAmount.toLocaleString()}</span>
            </div>
            {hasLateFee && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Late Fee</span>
                <span>${rentItem.lateFeeAmount?.toLocaleString()}</span>
              </div>
            )}
            {rentItem.amountPaid > 0 && (
              <div className="flex justify-between text-sm text-accent">
                <span>Already Paid</span>
                <span>-${rentItem.amountPaid.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Due</span>
              <span>${amountDue.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Credit Card">Credit Card •••• 4242</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Debit Card">Debit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amountDue.toLocaleString()}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
