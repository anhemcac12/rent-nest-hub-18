import { useState, useEffect } from 'react';
import { Check, X, Clock, MessageSquare, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  leaseApplicationApi, 
  LeaseApplicationResponseDTO, 
  LeaseApplicationStatus 
} from '@/lib/api/leaseApplicationApi';
import { propertyApi } from '@/lib/api/propertyApi';
import { ApiError } from '@/lib/api/client';
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

export default function PropertyManagerApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaseApplicationResponseDTO[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [reviewingApp, setReviewingApp] = useState<LeaseApplicationResponseDTO | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [message, setMessage] = useState('');
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Property managers need to get their managed properties first
      // For now, we'll fetch applications using a different approach
      // This would typically be a dedicated endpoint like /api/manager/applications
      
      // Since we don't have that endpoint yet, we'll show a placeholder
      // In a real implementation, you'd call something like:
      // const apps = await leaseApplicationApi.getManagerApplications();
      setApplications([]);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAction = async () => {
    if (!reviewingApp || !actionType) return;

    setIsActioning(true);

    try {
      if (actionType === 'approve') {
        await leaseApplicationApi.approveApplication(reviewingApp.id);
        toast({
          title: 'Application Approved',
          description: 'The tenant has been notified.',
        });
      } else {
        await leaseApplicationApi.rejectApplication(reviewingApp.id);
        toast({
          title: 'Application Rejected',
          description: 'The tenant has been notified of your decision.',
        });
      }
      
      fetchData();
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsActioning(false);
      setReviewingApp(null);
      setActionType(null);
      setMessage('');
    }
  };

  const getStatusBadge = (status: LeaseApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return app.status === 'PENDING';
    return app.status === selectedTab.toUpperCase();
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Review and manage tenant applications</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Review and manage tenant applications for your managed properties
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter(a => a.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({applications.filter(a => a.status === 'APPROVED').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter(a => a.status === 'REJECTED').length})
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
                    ? "No applications for your managed properties yet"
                    : `No ${selectedTab} applications`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <Card key={app.id}>
                  <Collapsible 
                    open={expandedApp === app.id}
                    onOpenChange={(open) => setExpandedApp(open ? app.id : null)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <img
                            src={app.property.coverImageUrl || '/placeholder.svg'}
                            alt={app.property.title}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                          <div>
                            <CardTitle className="text-lg">{app.property.title}</CardTitle>
                            <CardDescription>
                              {app.property.address}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(app.status)}
                              <span className="text-xs text-muted-foreground">
                                Applied {new Date(app.applicationDate).toLocaleDateString()}
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
                              <AvatarImage src={app.tenant.avatarUrl || undefined} />
                              <AvatarFallback>
                                {app.tenant.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {app.tenant.fullName}
                              </h4>
                              <p className="text-sm text-muted-foreground">{app.tenant.email}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          </div>

                          {/* Application Message */}
                          {app.message && (
                            <div>
                              <h5 className="font-medium mb-2">Applicant's Message</h5>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                                {app.message}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          {app.status === 'PENDING' && (
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
              ))}
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
                ? 'The tenant will be notified of your approval.'
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
              disabled={isActioning}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {isActioning ? 'Processing...' : (actionType === 'approve' ? 'Approve Application' : 'Reject Application')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
