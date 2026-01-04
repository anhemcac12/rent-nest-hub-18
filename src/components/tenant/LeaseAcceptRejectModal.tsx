import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LeaseResponseDTO } from '@/lib/api/leaseApi';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/lib/api/config';

interface LeaseAcceptRejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: LeaseResponseDTO;
  mode: 'accept' | 'reject';
  onAccept: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export function LeaseAcceptRejectModal({
  open,
  onOpenChange,
  lease,
  mode,
  onAccept,
  onReject,
}: LeaseAcceptRejectModalProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalDue = lease.securityDeposit + lease.rentAmount;

  const getContractUrl = () => {
    if (!lease.contractFileUrl) return null;
    if (lease.contractFileUrl.startsWith('http')) {
      return lease.contractFileUrl;
    }
    return `${API_BASE_URL}/${lease.contractFileUrl}`;
  };

  const handleAccept = async () => {
    if (!agreedToTerms) return;
    setIsProcessing(true);
    try {
      await onAccept();
      onOpenChange(false);
      setAgreedToTerms(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      await onReject(rejectionReason);
      onOpenChange(false);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setAgreedToTerms(false);
    setRejectionReason('');
  };

  if (mode === 'reject') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reject Lease Agreement
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this lease? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">{lease.propertyTitle}</h4>
              <p className="text-sm text-muted-foreground">{lease.propertyAddress}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please explain why you're rejecting this lease..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Lease'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Accept Lease Agreement
          </DialogTitle>
          <DialogDescription>
            Review the terms and accept to proceed with payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Property Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            {lease.propertyCoverImageUrl ? (
              <img
                src={lease.propertyCoverImageUrl}
                alt={lease.propertyTitle}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h4 className="font-semibold">{lease.propertyTitle}</h4>
              <p className="text-sm text-muted-foreground">{lease.propertyAddress}</p>
            </div>
          </div>

          {/* Lease Terms */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <h4 className="font-semibold">Lease Terms</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(new Date(lease.startDate), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">End Date</p>
                <p className="font-medium">{format(new Date(lease.endDate), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">${lease.rentAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Security Deposit</p>
                <p className="font-medium">${lease.securityDeposit.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Contract Document */}
          {lease.contractFileUrl && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Lease Contract Document</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = getContractUrl();
                  if (url) window.open(url, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          )}

          {/* Payment Summary */}
          <div className="p-4 bg-primary/5 rounded-lg">
            <h4 className="font-semibold mb-3">Payment Due Upon Acceptance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span>${lease.securityDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Month Rent</span>
                <span>${lease.rentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total</span>
                <span>${totalDue.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              You will have 48 hours to complete payment after accepting.
            </p>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              id="agree"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <label htmlFor="agree" className="text-sm cursor-pointer">
              I have read and agree to the lease terms and conditions. I understand that I will need to pay ${totalDue.toLocaleString()} within 48 hours to activate this lease.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isProcessing || !agreedToTerms}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? 'Accepting...' : 'Accept & Proceed to Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
