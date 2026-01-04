import { useState, useEffect } from 'react';
import { ScrollText, Calendar, DollarSign, Clock, TrendingUp, FileText, History, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { leaseApi, LeaseResponseDTO, LeaseStatus } from '@/lib/api/leaseApi';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/api/config';

export default function PropertyManagerLeases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leases, setLeases] = useState<LeaseResponseDTO[]>([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLeases();
    }
  }, [user]);

  const fetchLeases = async () => {
    try {
      setIsLoading(true);
      const data = await leaseApi.getLeasesForLandlord();
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
  };

  const handleTerminateLease = async (leaseId: number) => {
    try {
      await leaseApi.terminateLease(leaseId);
      toast({
        title: 'Lease Terminated',
        description: 'The lease has been terminated and property is now available.',
      });
      fetchLeases();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: LeaseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pending Review</Badge>;
      case 'AWAITING_PAYMENT':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Awaiting Payment</Badge>;
      case 'TERMINATED':
        return <Badge variant="destructive">Terminated</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredLeases = leases.filter(lease => {
    switch (selectedTab) {
      case 'pending':
        return lease.status === 'PENDING' || lease.status === 'AWAITING_PAYMENT';
      case 'active':
        return lease.status === 'ACTIVE';
      case 'past':
        return ['EXPIRED', 'TERMINATED'].includes(lease.status);
      case 'all':
      default:
        return true;
    }
  });

  const pendingCount = leases.filter(l => l.status === 'PENDING' || l.status === 'AWAITING_PAYMENT').length;
  const activeCount = leases.filter(l => l.status === 'ACTIVE').length;
  const pastCount = leases.filter(l => ['EXPIRED', 'TERMINATED'].includes(l.status)).length;

  const calculateMonthsRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  const monthlyIncome = leases.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + l.rentAmount, 0);

  const getStatusIndicator = (lease: LeaseResponseDTO) => {
    const monthsRemaining = calculateMonthsRemaining(lease.endDate);
    
    switch (lease.status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Awaiting tenant review
          </Badge>
        );
      case 'AWAITING_PAYMENT':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Tenant accepted, awaiting payment
          </Badge>
        );
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''} remaining
            </Badge>
          </div>
        );
      case 'EXPIRED':
      case 'TERMINATED':
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

  const getContractUrl = (lease: LeaseResponseDTO) => {
    if (!lease.contractFileUrl) return null;
    if (lease.contractFileUrl.startsWith('http')) {
      return lease.contractFileUrl;
    }
    return `${API_BASE_URL}/${lease.contractFileUrl}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
          <p className="text-muted-foreground">Loading lease agreements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
        <p className="text-muted-foreground">
          Track lease agreements for your managed properties
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leases</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting activation</p>
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
            <p className="text-xs text-muted-foreground">From managed leases</p>
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
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastCount})</TabsTrigger>
          <TabsTrigger value="all">All ({leases.length})</TabsTrigger>
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
                  No lease agreements for your managed properties yet
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
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{lease.propertyTitle}</CardTitle>
                            {getStatusBadge(lease.status)}
                          </div>
                          <CardDescription>
                            {lease.propertyAddress}
                          </CardDescription>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="mt-2">{getStatusIndicator(lease)}</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={lease.tenantAvatarUrl || undefined} />
                          <AvatarFallback>
                            {lease.tenantName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{lease.tenantName}</h4>
                          <p className="text-sm text-muted-foreground">{lease.tenantEmail}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/pm-messages')}>
                          Contact
                        </Button>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Rent</p>
                            <p className="text-xl font-bold">${lease.rentAmount.toLocaleString()}</p>
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
                              Contract
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <Button variant="outline" className="flex-1" onClick={() => navigate(`/properties/${lease.propertyId}`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Property
                      </Button>
                      {lease.status === 'ACTIVE' && (
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleTerminateLease(lease.id)}
                        >
                          Terminate Lease
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
