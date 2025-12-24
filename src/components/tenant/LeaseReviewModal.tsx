import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, DollarSign, FileText, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { LeaseAgreement } from '@/types/landlord';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaseReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: LeaseAgreement;
  onAccept: () => void;
  onReject: (reason: string) => void;
}

export function LeaseReviewModal({
  open,
  onOpenChange,
  lease,
  onAccept,
  onReject,
}: LeaseReviewModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalDue = lease.securityDeposit + lease.monthlyRent;

  const handleAccept = () => {
    setIsProcessing(true);
    onAccept();
    setIsProcessing(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    setIsProcessing(true);
    onReject(rejectReason);
    setIsProcessing(false);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Lease Agreement</DialogTitle>
          <DialogDescription>
            Please review the lease terms carefully before accepting.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">Lease Terms</TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({lease.documents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-6 py-4">
            {/* Property Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <img
                src={lease.property.thumbnail}
                alt={lease.property.title}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-semibold">{lease.property.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {lease.property.address.street}, {lease.property.address.city}, {lease.property.address.state} {lease.property.address.zipCode}
                </p>
                <Badge variant="outline" className="mt-1">
                  {lease.property.bedrooms} bed • {lease.property.bathrooms} bath • {lease.property.size} sqft
                </Badge>
              </div>
            </div>

            {/* Lease Duration */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Lease Duration</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(lease.startDate), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{format(new Date(lease.endDate), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Financial Terms */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Financial Terms</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-semibold">${lease.monthlyRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security Deposit</span>
                  <span className="font-semibold">${lease.securityDeposit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-3">Payment Due Upon Acceptance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Security Deposit</span>
                  <span>${lease.securityDeposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>First Month Rent</span>
                  <span>${lease.monthlyRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total Due Now</span>
                  <span>${totalDue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="py-4">
            {!lease.documents || lease.documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No documents attached</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lease.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {doc.type === 'pdf' ? (
                        <FileText className="h-8 w-8 text-red-500" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDocument(doc.url)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {showRejectForm ? (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea
                placeholder="Please explain why you're rejecting this lease agreement..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={!rejectReason.trim() || isProcessing}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRejectForm(true)}
            >
              Reject Lease
            </Button>
            <Button onClick={handleAccept} disabled={isProcessing}>
              Accept & Pay ${totalDue.toLocaleString()}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
