import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Calendar, DollarSign, Clock, CheckCircle2, XCircle, FileText, ExternalLink, CreditCard, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeRefresh } from '@/contexts/RealtimeContext';
import { leaseApi, LeaseResponseDTO, LeaseStatus } from '@/lib/api/leaseApi';
import { toast } from '@/hooks/use-toast';
import { format, differenceInHours } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api/config';
import { LeaseAcceptRejectModal } from '@/components/tenant/LeaseAcceptRejectModal';
import { LeasePaymentModal } from '@/components/tenant/LeasePaymentModal';

export default function TenantLeases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leases, setLeases] = useState<LeaseResponseDTO[]>([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [selectedLease, setSelectedLease] = useState<LeaseResponseDTO | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (user) {
      refreshLeases();
    }
  }, [user]);

  const refreshLeases = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await leaseApi.getMyLeases();
      setLeases(data);
    } catch (error: any) {
      toast({
        title: 'Error loading leases',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh when LEASE or PAYMENT notifications are received
  useRealtimeRefresh(['LEASE', 'PAYMENT'], refreshLeases);

  const getStatusBadge = (status: LeaseStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'AWAITING_PAYMENT':
        return <Badge className="bg-blue-500"><CreditCard className="h-3 w-3 mr-1" />Awaiting Payment</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'TERMINATED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Terminated</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDeadlineInfo = (lease: LeaseResponseDTO) => {
    if (lease.status !== 'AWAITING_PAYMENT' || !lease.acceptanceDeadline) return null;
    
    const deadline = new Date(lease.acceptanceDeadline);
    const hoursRemaining = differenceInHours(deadline, new Date());
    
    if (hoursRemaining <= 0) {
      return { expired: true, text: 'Payment deadline expired' };
    }
    
    if (hoursRemaining <= 12) {
      return { expired: false, urgent: true, text: `${hoursRemaining}h remaining` };
    }
    
    return { expired: false, urgent: false, text: `${hoursRemaining}h remaining to pay` };
  };

  const filteredLeases = leases.filter((lease) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return lease.status === 'PENDING' || lease.status === 'AWAITING_PAYMENT';
    if (selectedTab === 'active') return lease.status === 'ACTIVE';
    if (selectedTab === 'past') return lease.status === 'EXPIRED' || lease.status === 'TERMINATED';
    return true;
  });

  const pendingCount = leases.filter(l => l.status === 'PENDING' || l.status === 'AWAITING_PAYMENT').length;
  const activeCount = leases.filter(l => l.status === 'ACTIVE').length;
  const pastCount = leases.filter(l => l.status === 'EXPIRED' || l.status === 'TERMINATED').length;

  const getContractUrl = (lease: LeaseResponseDTO) => {
    if (!lease.contractFileUrl) return null;
    if (lease.contractFileUrl.startsWith('http')) {
      return lease.contractFileUrl;
    }
    return `${API_BASE_URL}/${lease.contractFileUrl}`;
  };

  const handleAcceptLease = async () => {
    if (!selectedLease) return;
    try {
      await leaseApi.acceptLease(selectedLease.id);
      toast({
        title: 'Lease Accepted',
        description: 'You now have 48 hours to complete payment.',
      });
      refreshLeases();
      // Show payment modal after accepting
      setShowAcceptModal(false);
      // Re-fetch the updated lease and show payment modal
      const updatedLease = await leaseApi.getLeaseById(selectedLease.id);
      setSelectedLease(updatedLease);
      setShowPaymentModal(true);
    } catch (error: any) {
      toast({
        title: 'Error accepting lease',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleRejectLease = async (reason: string) => {
    if (!selectedLease) return;
    try {
      await leaseApi.rejectLease(selectedLease.id, reason);
      toast({
        title: 'Lease Rejected',
        description: 'The landlord has been notified of your decision.',
      });
      refreshLeases();
    } catch (error: any) {
      toast({
        title: 'Error rejecting lease',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handlePaymentComplete = () => {
    toast({
      title: 'Lease Activated',
      description: 'Congratulations! Your lease is now active.',
    });
    refreshLeases();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
          <p className="text-muted-foreground">Loading your lease agreements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
        <p className="text-muted-foreground">
          View and manage your lease agreements
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastCount})
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
                    ? 'No pending lease agreements'
                    : selectedTab === 'active'
                    ? 'You have no active leases'
                    : 'No lease agreements found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLeases.map((lease) => {
                const deadlineInfo = getDeadlineInfo(lease);
                
                return (
                  <Card key={lease.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {lease.propertyCoverImageUrl ? (
                            <img
                              src={lease.propertyCoverImageUrl}
                              alt={lease.propertyTitle}
                              className="h-20 w-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                              <ScrollText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-lg">{lease.propertyTitle}</CardTitle>
                              {getStatusBadge(lease.status)}
                            </div>
                            <CardDescription>
                              {lease.propertyAddress}
                            </CardDescription>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {format(new Date(lease.startDate), 'MMM d, yyyy')} - {format(new Date(lease.endDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            {/* Deadline Warning */}
                            {deadlineInfo && (
                              <div className={`flex items-center gap-1.5 mt-2 text-sm ${
                                deadlineInfo.expired ? 'text-red-600' : 
                                deadlineInfo.urgent ? 'text-amber-600' : 'text-blue-600'
                              }`}>
                                {deadlineInfo.expired ? (
                                  <AlertTriangle className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4" />
                                )}
                                <span className="font-medium">{deadlineInfo.text}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Financial Summary */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Monthly Rent</span>
                          </div>
                          <p className="text-xl font-bold">${lease.rentAmount.toLocaleString()}</p>
                          {lease.securityDeposit > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Security Deposit: ${lease.securityDeposit.toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Contract Document */}
                        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Lease Contract</p>
                            <p className="font-medium">
                              {lease.contractFileUrl ? 'Document attached' : 'No document'}
                            </p>
                          </div>
                          {lease.contractFileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const url = getContractUrl(lease);
                                if (url) window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Pending Leases */}
                      {lease.status === 'PENDING' && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                          <h4 className="font-semibold text-amber-800 mb-2">Action Required</h4>
                          <p className="text-sm text-amber-700 mb-3">
                            Review the lease terms and contract document, then accept or reject this lease.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setSelectedLease(lease);
                                setShowAcceptModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Accept Lease
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedLease(lease);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Payment CTA for AWAITING_PAYMENT */}
                      {lease.status === 'AWAITING_PAYMENT' && !deadlineInfo?.expired && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Payment Required</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Complete your payment of ${(lease.securityDeposit + lease.rentAmount).toLocaleString()} (security deposit + first month rent) to activate your lease.
                          </p>
                          <Button
                            onClick={() => {
                              setSelectedLease(lease);
                              setShowPaymentModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Complete Payment
                          </Button>
                        </div>
                      )}

                      {/* Rejected/Terminated Info */}
                      {lease.status === 'TERMINATED' && lease.rejectionReason && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-1">Rejection Reason</h4>
                          <p className="text-sm text-red-700">{lease.rejectionReason}</p>
                        </div>
                      )}

                      {lease.status === 'TERMINATED' && lease.terminationReason && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-1">Termination Reason</h4>
                          <p className="text-sm text-red-700">{lease.terminationReason}</p>
                        </div>
                      )}

                      {/* Landlord Info */}
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Landlord: </span>
                          <span className="font-medium">{lease.landlordName}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/properties/${lease.propertyId}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Property
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Accept/Reject Modal */}
      {selectedLease && (showAcceptModal || showRejectModal) && (
        <LeaseAcceptRejectModal
          open={showAcceptModal || showRejectModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowAcceptModal(false);
              setShowRejectModal(false);
              setSelectedLease(null);
            }
          }}
          lease={selectedLease}
          mode={showAcceptModal ? 'accept' : 'reject'}
          onAccept={handleAcceptLease}
          onReject={handleRejectLease}
        />
      )}

      {/* Payment Modal */}
      {selectedLease && showPaymentModal && (
        <LeasePaymentModal
          open={showPaymentModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowPaymentModal(false);
              setSelectedLease(null);
            }
          }}
          lease={selectedLease}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
