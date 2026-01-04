import { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeaseResponseDTO } from '@/lib/api/leaseApi';
import { paymentApi, PaymentSummaryDTO } from '@/lib/api/paymentApi';
import { toast } from '@/hooks/use-toast';
import { differenceInHours, format } from 'date-fns';

interface LeasePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: LeaseResponseDTO;
  onPaymentComplete: () => void;
}

export function LeasePaymentModal({
  open,
  onOpenChange,
  lease,
  onPaymentComplete,
}: LeasePaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [summary, setSummary] = useState<PaymentSummaryDTO | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    if (open && lease.status === 'AWAITING_PAYMENT') {
      loadPaymentSummary();
    }
  }, [open, lease.id, lease.status]);

  const loadPaymentSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const data = await paymentApi.getPaymentSummary(lease.id);
      setSummary(data);
    } catch (error: any) {
      toast({
        title: 'Error loading payment details',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const totalDue = summary?.totalDue ?? (lease.securityDeposit + lease.rentAmount);
  const hoursRemaining = summary?.hoursRemaining ?? 
    (lease.acceptanceDeadline 
      ? differenceInHours(new Date(lease.acceptanceDeadline), new Date())
      : null);
  const isExpired = summary?.isExpired ?? false;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !cardName) return;

    setIsProcessing(true);

    try {
      await paymentApi.makeAcceptancePayment(lease.id, {
        amount: totalDue,
        paymentMethod: 'Credit Card',
        description: 'Security deposit and first month rent',
      });

      setPaymentSuccess(true);
      
      // Wait a moment then complete
      setTimeout(() => {
        onPaymentComplete();
        onOpenChange(false);
        setPaymentSuccess(false);
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setCardName('');
        setSummary(null);
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!isProcessing) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setCardName('');
        setPaymentSuccess(false);
        setSummary(null);
      }
    }
  };

  if (paymentSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground text-center">
              Your lease is now active. Welcome to your new home!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isExpired) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Payment Deadline Expired</h3>
            <p className="text-muted-foreground text-center">
              The 48-hour payment window has passed. Please contact the landlord to discuss next steps.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Pay security deposit and first month's rent to activate your lease.
          </DialogDescription>
        </DialogHeader>

        {isLoadingSummary ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading payment details...
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Deadline Warning */}
            {hoursRemaining !== null && hoursRemaining > 0 && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                hoursRemaining <= 12 ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {hoursRemaining <= 1 
                    ? 'Less than 1 hour remaining'
                    : `${Math.floor(hoursRemaining)} hours remaining to complete payment`}
                </span>
              </div>
            )}

            {/* Payment Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3">{lease.propertyTitle}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security Deposit</span>
                  <span>${(summary?.securityDeposit ?? lease.securityDeposit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Month Rent</span>
                  <span>${(summary?.firstMonthRent ?? lease.rentAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>${totalDue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Card Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Your payment is secured with 256-bit encryption</span>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handlePayment}
          disabled={isProcessing || isLoadingSummary || !cardNumber || !expiry || !cvv || !cardName}
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>Pay ${totalDue.toLocaleString()}</>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
