import { useState, useEffect } from 'react';
import { ScrollText, Calendar, DollarSign, Clock, TrendingUp, Eye, FileText, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaseAgreements, getUsers } from '@/lib/mockDatabase';
import { LeaseAgreement } from '@/types/landlord';
import { User as UserType } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import { LeaseDetailsModal } from '@/components/landlord/LeaseDetailsModal';

export default function LeaseAgreementsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedLease, setSelectedLease] = useState<LeaseAgreement | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setLeases(getLeaseAgreements(user.id));
      setUsers(getUsers());
    }
  }, [user]);

  const handleViewDetails = (lease: LeaseAgreement) => {
    setSelectedLease(lease);
    setDetailsModalOpen(true);
  };

  const getTenantInfo = (tenantId: string) => {
    return users.find(u => u.id === tenantId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'pending_tenant':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Tenant</Badge>;
      case 'tenant_accepted':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Tenant Accepted</Badge>;
      case 'payment_pending':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Payment Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter leases based on selected tab
  const filteredLeases = leases.filter(lease => {
    switch (selectedTab) {
      case 'pending':
        return ['pending_tenant', 'tenant_accepted', 'payment_pending'].includes(lease.status);
      case 'active':
        return lease.status === 'active';
      case 'rejected':
        return lease.status === 'rejected';
      case 'past':
        return ['expired', 'terminated'].includes(lease.status);
      case 'all':
      default:
        return true;
    }
  });

  // Counts for tabs
  const pendingCount = leases.filter(l => ['pending_tenant', 'tenant_accepted', 'payment_pending'].includes(l.status)).length;
  const activeCount = leases.filter(l => l.status === 'active').length;
  const rejectedCount = leases.filter(l => l.status === 'rejected').length;
  const pastCount = leases.filter(l => ['expired', 'terminated'].includes(l.status)).length;

  const calculateMonthsRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  const calculateDaysSinceSent = (sentDate: string) => {
    const sent = new Date(sentDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - sent.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate stats
  const monthlyIncome = leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.monthlyRent, 0);
  const totalSecurityDeposits = leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.securityDeposit, 0);

  const getStatusIndicator = (lease: LeaseAgreement) => {
    const monthsRemaining = calculateMonthsRemaining(lease.endDate);
    
    switch (lease.status) {
      case 'pending_tenant':
        const daysSent = lease.sentToTenantAt ? calculateDaysSinceSent(lease.sentToTenantAt) : 0;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <Clock className="h-3 w-3 mr-1" />
              Sent {daysSent} day{daysSent !== 1 ? 's' : ''} ago
            </Badge>
            <span className="text-sm text-muted-foreground">Waiting for tenant response</span>
          </div>
        );
      case 'tenant_accepted':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Tenant accepted - Awaiting payment
          </Badge>
        );
      case 'payment_pending':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            Payment in progress
          </Badge>
        );
      case 'active':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''} remaining
            </Badge>
          </div>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            Tenant declined
          </Badge>
        );
      case 'expired':
      case 'terminated':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            <History className="h-3 w-3 mr-1" />
            Ended {new Date(lease.endDate).toLocaleDateString()}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getEmptyStateMessage = () => {
    switch (selectedTab) {
      case 'pending':
        return 'Pending lease agreements will appear here after you create them from approved applications';
      case 'active':
        return 'Active leases will appear here once tenants accept and pay';
      case 'rejected':
        return 'No rejected lease agreements';
      case 'past':
        return 'Expired and terminated leases will appear here';
      default:
        return 'No lease agreements found';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
        <p className="text-muted-foreground">
          Track and manage your lease agreements across all stages
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leases</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting tenant response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <ScrollText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From active leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Leases</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastCount}</div>
            <p className="text-xs text-muted-foreground">Expired or terminated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedCount})
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
                  {getEmptyStateMessage()}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLeases.map((lease) => {
                const tenant = getTenantInfo(lease.tenantId);
                
                return (
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
                              {lease.property.address.city}, {lease.property.address.state}
                            </CardDescription>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              {getStatusIndicator(lease)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Tenant Info */}
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={lease.tenantAvatar || tenant?.avatar} />
                            <AvatarFallback>
                              {lease.tenantName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{lease.tenantName}</h4>
                            <p className="text-sm text-muted-foreground">{lease.tenantEmail}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/messages')}>
                            Contact
                          </Button>
                        </div>

                        {/* Financial Info */}
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
                      </div>

                      {/* Show rejection reason if rejected */}
                      {lease.status === 'rejected' && lease.rejectionReason && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{lease.rejectionReason}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(lease)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => navigate(`/properties/${lease.propertyId}`)}>
                          <FileText className="h-4 w-4 mr-2" />
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

      <LeaseDetailsModal
        lease={selectedLease}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
}
