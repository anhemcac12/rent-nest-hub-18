import { useState, useEffect } from 'react';
import { ScrollText, Calendar, DollarSign, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getTenantLeases, acceptLease, rejectLease, processLeasePayment } from '@/lib/mockDatabase';
import { LeaseAgreement } from '@/types/landlord';
import { LeaseReviewModal } from '@/components/tenant/LeaseReviewModal';
import { LeasePaymentModal } from '@/components/tenant/LeasePaymentModal';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function TenantLeases() {
  const { user } = useAuth();
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [reviewingLease, setReviewingLease] = useState<LeaseAgreement | null>(null);
  const [payingLease, setPayingLease] = useState<LeaseAgreement | null>(null);

  useEffect(() => {
    if (user) {
      refreshLeases();
    }
  }, [user]);

  const refreshLeases = () => {
    if (user) {
      setLeases(getTenantLeases(user.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_tenant':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'tenant_accepted':
      case 'payment_pending':
        return <Badge variant="outline"><DollarSign className="h-3 w-3 mr-1" />Payment Pending</Badge>;
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAcceptLease = () => {
    if (!reviewingLease || !user) return;
    
    acceptLease(reviewingLease.id);
    setReviewingLease(null);
    setPayingLease(reviewingLease);
    refreshLeases();
  };

  const handleRejectLease = (reason: string) => {
    if (!reviewingLease || !user) return;
    
    rejectLease(reviewingLease.id, reason);
    toast({
      title: 'Lease Rejected',
      description: 'The landlord has been notified of your decision.',
    });
    setReviewingLease(null);
    refreshLeases();
  };

  const handlePaymentComplete = () => {
    if (!payingLease || !user) return;
    
    processLeasePayment(payingLease.id);
    toast({
      title: 'Payment Successful!',
      description: 'Your lease is now active. Welcome to your new home!',
    });
    setPayingLease(null);
    refreshLeases();
  };

  const filteredLeases = leases.filter((lease) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return lease.status === 'pending_tenant' || lease.status === 'payment_pending';
    if (selectedTab === 'active') return lease.status === 'active';
    if (selectedTab === 'past') return lease.status === 'expired' || lease.status === 'rejected' || lease.status === 'terminated';
    return true;
  });

  const pendingCount = leases.filter(l => l.status === 'pending_tenant' || l.status === 'payment_pending').length;
  const activeCount = leases.filter(l => l.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
        <p className="text-muted-foreground">
          Review and manage your lease agreements
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({leases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {filteredLeases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ScrollText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No lease agreements</h3>
                <p className="text-muted-foreground text-center">
                  {selectedTab === 'pending'
                    ? 'No pending lease agreements to review'
                    : selectedTab === 'active'
                    ? 'You have no active leases'
                    : 'No lease agreements found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLeases.map((lease) => (
                <Card key={lease.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <img
                          src={lease.property.thumbnail}
                          alt={lease.property.title}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{lease.property.title}</CardTitle>
                            {getStatusBadge(lease.status)}
                          </div>
                          <CardDescription>
                            {lease.property.address.street}, {lease.property.address.city}, {lease.property.address.state}
                          </CardDescription>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(lease.startDate), 'MMM d, yyyy')} - {format(new Date(lease.endDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Financial Summary */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Rent</p>
                            <p className="text-xl font-bold">${lease.monthlyRent.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Security Deposit</p>
                            <p className="text-xl font-bold">${lease.securityDeposit.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Documents Count */}
                      <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Attached Documents</p>
                          <p className="text-xl font-bold">{lease.documents?.length || 0} files</p>
                        </div>
                        {lease.documents && lease.documents.length > 0 && (
                          <ScrollText className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Actions based on status */}
                    {lease.status === 'pending_tenant' && (
                      <Button
                        className="w-full mt-4"
                        onClick={() => setReviewingLease(lease)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review & Accept/Reject
                      </Button>
                    )}

                    {(lease.status === 'tenant_accepted' || lease.status === 'payment_pending') && (
                      <Button
                        className="w-full mt-4"
                        onClick={() => setPayingLease(lease)}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Complete Payment (${(lease.securityDeposit + lease.monthlyRent).toLocaleString()})
                      </Button>
                    )}

                    {lease.status === 'rejected' && lease.rejectionReason && (
                      <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                        <p className="text-sm text-muted-foreground">{lease.rejectionReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      {reviewingLease && (
        <LeaseReviewModal
          open={!!reviewingLease}
          onOpenChange={(open) => !open && setReviewingLease(null)}
          lease={reviewingLease}
          onAccept={handleAcceptLease}
          onReject={handleRejectLease}
        />
      )}

      {/* Payment Modal */}
      {payingLease && (
        <LeasePaymentModal
          open={!!payingLease}
          onOpenChange={(open) => !open && setPayingLease(null)}
          lease={payingLease}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
