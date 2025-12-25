import { useState, useEffect } from 'react';
import { Check, X, Eye, Clock, User, Calendar, MessageSquare, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getApplicationsForLandlord, 
  updateApplicationStatus, 
  getUsers,
  createLeaseFromApplication
} from '@/lib/mockDatabase';
import { Application } from '@/types/tenant';
import { User as UserType } from '@/types/user';
import { LeaseDocument } from '@/types/landlord';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { CreateLeaseModal } from '@/components/landlord/CreateLeaseModal';

export default function LandlordApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [message, setMessage] = useState('');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [creatingLeaseFor, setCreatingLeaseFor] = useState<Application | null>(null);

  useEffect(() => {
    if (user) {
      setApplications(getApplicationsForLandlord(user.id));
      setUsers(getUsers());
    }
  }, [user]);

  const refreshApplications = () => {
    if (user) {
      setApplications(getApplicationsForLandlord(user.id));
    }
  };

  const getTenantInfo = (tenantId: string) => {
    return users.find(u => u.id === tenantId);
  };

  const handleAction = () => {
    if (!reviewingApp || !actionType || !user) return;

    if (actionType === 'approve') {
      // Just update status to approved, then show create lease modal
      const success = updateApplicationStatus(
        reviewingApp.id,
        'approved',
        message || 'Your application has been approved! Please review the lease agreement.'
      );

      if (success) {
        toast({
          title: 'Application Approved',
          description: 'Now create the lease agreement for the tenant.',
        });
        refreshApplications();
        setReviewingApp(null);
        setActionType(null);
        setMessage('');
        
        // Find the updated application and open lease creation
        const updatedApps = getApplicationsForLandlord(user.id);
        const approvedApp = updatedApps.find(a => a.id === reviewingApp.id);
        if (approvedApp) {
          setCreatingLeaseFor(approvedApp);
        }
      }
    } else {
      // Reject
      const success = updateApplicationStatus(
        reviewingApp.id,
        'rejected',
        message
      );

      if (success) {
        toast({
          title: 'Application Rejected',
          description: 'The tenant has been notified of your decision.',
        });
        refreshApplications();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update application status.',
          variant: 'destructive',
        });
      }

      setReviewingApp(null);
      setActionType(null);
      setMessage('');
    }
  };

  const handleCreateLease = (leaseData: {
    monthlyRent: number;
    securityDeposit: number;
    startDate: string;
    endDate: string;
    documents: LeaseDocument[];
  }) => {
    if (!creatingLeaseFor || !user) return;

    const lease = createLeaseFromApplication(
      creatingLeaseFor.id,
      user.id,
      leaseData
    );

    if (lease) {
      toast({
        title: 'Lease Agreement Created',
        description: 'The tenant has been notified to review and accept the lease.',
      });
      setCreatingLeaseFor(null);
      refreshApplications();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create lease agreement.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'under_review':
        return <Badge variant="outline">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return app.status === 'pending' || app.status === 'under_review';
    return app.status === selectedTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Review and manage tenant applications for your properties
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter(a => a.status === 'pending' || a.status === 'under_review').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({applications.filter(a => a.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter(a => a.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No applications</h3>
                <p className="text-muted-foreground text-center">
                  {selectedTab === 'all' 
                    ? "You haven't received any applications yet"
                    : `No ${selectedTab} applications`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const tenant = getTenantInfo(app.tenantId);
                return (
                  <Card key={app.id}>
                    <Collapsible 
                      open={expandedApp === app.id}
                      onOpenChange={(open) => setExpandedApp(open ? app.id : null)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <img
                              src={app.property.thumbnail}
                              alt={app.property.title}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                            <div>
                              <CardTitle className="text-lg">{app.property.title}</CardTitle>
                              <CardDescription>
                                {app.property.address.city}, {app.property.address.state}
                              </CardDescription>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(app.status)}
                                <span className="text-xs text-muted-foreground">
                                  Applied {new Date(app.appliedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedApp === app.id ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </CardHeader>

                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="border-t pt-4 space-y-4">
                            {/* Applicant Info */}
                            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={tenant?.avatar} />
                              <AvatarFallback>
                                  {tenant?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {tenant?.fullName}
                                </h4>
                                <p className="text-sm text-muted-foreground">{tenant?.email}</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Contact
                              </Button>
                            </div>

                            {/* Application Details */}
                            {app.notes && (
                              <div>
                                <h5 className="font-medium mb-2">Applicant's Message</h5>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                  {app.notes}
                                </p>
                              </div>
                            )}

                            {/* Timeline */}
                            <div>
                              <h5 className="font-medium mb-2">Timeline</h5>
                              <div className="space-y-2">
                                {app.timeline.map((event, idx) => (
                                  <div key={event.id} className="flex items-start gap-3 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                    <div>
                                      <p className="font-medium">{event.message}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(event.timestamp).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            {(app.status === 'pending' || app.status === 'under_review') && (
                              <div className="flex items-center gap-3 pt-2">
                                <Button 
                                  className="flex-1"
                                  onClick={() => {
                                    setReviewingApp(app);
                                    setActionType('approve');
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => {
                                    setReviewingApp(app);
                                    setActionType('reject');
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!reviewingApp && !!actionType} onOpenChange={() => {
        setReviewingApp(null);
        setActionType(null);
        setMessage('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This will create a lease agreement and notify the tenant.'
                : 'The tenant will be notified of your decision.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message to Tenant (Optional)</Label>
              <Textarea
                placeholder={actionType === 'approve' 
                  ? 'Congratulations! We look forward to having you as our tenant...'
                  : 'Thank you for your interest. Unfortunately...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setReviewingApp(null);
              setActionType(null);
              setMessage('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {actionType === 'approve' ? 'Approve & Create Lease' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lease Modal */}
      {creatingLeaseFor && (
        <CreateLeaseModal
          open={!!creatingLeaseFor}
          onOpenChange={(open) => !open && setCreatingLeaseFor(null)}
          application={creatingLeaseFor}
          onSubmit={handleCreateLease}
        />
      )}
    </div>
  );
}
