import { useState, useEffect } from 'react';
import { ScrollText, Calendar, DollarSign, User, Building2, FileText } from 'lucide-react';
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

export default function LeaseAgreementsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedTab, setSelectedTab] = useState('active');

  useEffect(() => {
    if (user) {
      setLeases(getLeaseAgreements(user.id));
      setUsers(getUsers());
    }
  }, [user]);

  const getTenantInfo = (tenantId: string) => {
    return users.find(u => u.id === tenantId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredLeases = leases.filter(lease => {
    if (selectedTab === 'all') return true;
    return lease.status === selectedTab;
  });

  const calculateMonthsRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
        <p className="text-muted-foreground">
          Manage your active and past lease agreements
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leases.filter(l => l.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.monthlyRent, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Security Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.securityDeposit, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({leases.filter(l => l.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({leases.filter(l => l.status === 'expired').length})
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
                  {selectedTab === 'active' 
                    ? 'Lease agreements will appear here when you approve applications'
                    : 'No lease agreements found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLeases.map((lease) => {
                const tenant = getTenantInfo(lease.tenantId);
                const monthsRemaining = calculateMonthsRemaining(lease.endDate);
                
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
                              {lease.status === 'active' && (
                                <Badge variant="outline">{monthsRemaining} months remaining</Badge>
                              )}
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

                      <div className="flex items-center gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => navigate(`/properties/${lease.propertyId}`)}>
                          <Building2 className="h-4 w-4 mr-2" />
                          View Property
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          View Agreement
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
    </div>
  );
}
