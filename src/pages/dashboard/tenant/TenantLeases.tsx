import { useState, useEffect } from 'react';
import { ScrollText, Calendar, DollarSign, Clock, CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { leaseApi, LeaseResponseDTO, LeaseStatus } from '@/lib/api/leaseApi';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api/config';

export default function TenantLeases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leases, setLeases] = useState<LeaseResponseDTO[]>([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      refreshLeases();
    }
  }, [user]);

  const refreshLeases = async () => {
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
  };

  const getStatusBadge = (status: LeaseStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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

  const filteredLeases = leases.filter((lease) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return lease.status === 'PENDING';
    if (selectedTab === 'active') return lease.status === 'ACTIVE';
    if (selectedTab === 'past') return lease.status === 'EXPIRED' || lease.status === 'TERMINATED';
    return true;
  });

  const pendingCount = leases.filter(l => l.status === 'PENDING').length;
  const activeCount = leases.filter(l => l.status === 'ACTIVE').length;
  const pastCount = leases.filter(l => l.status === 'EXPIRED' || l.status === 'TERMINATED').length;

  const getContractUrl = (lease: LeaseResponseDTO) => {
    if (!lease.contractFileUrl) return null;
    // If it's already a full URL, return it; otherwise prepend base URL
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
          View your lease agreements
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
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Monthly Rent</span>
                        </div>
                        <p className="text-xl font-bold">${lease.rentAmount.toLocaleString()}</p>
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
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
