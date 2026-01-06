import { useState, useEffect, useCallback } from 'react';
import { Check, X, Clock, MessageSquare, ChevronDown, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeRefresh } from '@/contexts/RealtimeContext';
import { 
  leaseApplicationApi, 
  LeaseApplicationResponseDTO, 
  LeaseApplicationStatus 
} from '@/lib/api/leaseApplicationApi';
import { propertyApi } from '@/lib/api/propertyApi';
import { leaseApi, CreateLeaseRequestDTO } from '@/lib/api/leaseApi';
import { fileApi } from '@/lib/api/fileApi';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload } from 'lucide-react';

export default function LandlordApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaseApplicationResponseDTO[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [reviewingApp, setReviewingApp] = useState<LeaseApplicationResponseDTO | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [message, setMessage] = useState('');
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  
  // Lease creation state
  const [creatingLeaseForApp, setCreatingLeaseForApp] = useState<LeaseApplicationResponseDTO | null>(null);
  const [leaseRent, setLeaseRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isCreatingLease, setIsCreatingLease] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const propertiesData = await propertyApi.getPropertiesByLandlord(Number(user.id));

      const allApplications: LeaseApplicationResponseDTO[] = [];
      for (const property of propertiesData) {
        try {
          const apps = await leaseApplicationApi.getApplicationsForProperty(property.id);
          allApplications.push(...apps);
        } catch {
          // Property might not have applications, continue
        }
      }
      setApplications(allApplications);
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
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh when APPLICATION notifications are received
  useRealtimeRefresh(['APPLICATION'], fetchData);

  const handleAction = async () => {
    if (!reviewingApp || !actionType) return;

    setIsActioning(true);

    try {
      if (actionType === 'approve') {
        await leaseApplicationApi.approveApplication(reviewingApp.id);
        toast({
          title: 'Application Approved',
          description: 'You can now create a lease agreement for this tenant.',
        });
        // After approval, show lease creation dialog
        setCreatingLeaseForApp(reviewingApp);
        setLeaseRent(reviewingApp.property.price?.toString() || '');
        setSecurityDeposit(reviewingApp.property.price?.toString() || ''); // Default to 1 month rent
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

  const handleCreateLease = async () => {
    if (!creatingLeaseForApp) return;

    setIsCreatingLease(true);

    try {
      // Step 1: Create the lease draft
      const leaseData: CreateLeaseRequestDTO = {
        approvedApplicationId: creatingLeaseForApp.id,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        rentAmount: parseFloat(leaseRent),
        securityDeposit: parseFloat(securityDeposit),
      };

      const createdLease = await leaseApi.createLease(leaseData);

      // Step 2: If contract file is provided, upload and attach
      if (contractFile) {
        const uploadedDoc = await fileApi.upload(contractFile, 'LEASE_PDF');
        await leaseApi.attachContract(createdLease.id, uploadedDoc.documentId);
      }

      // Note: Lease stays PENDING until tenant accepts and pays
      // No longer auto-activating here

      toast({
        title: 'Lease Created & Sent to Tenant',
        description: 'The lease is now active and the property is marked as rented.',
      });

      setCreatingLeaseForApp(null);
      setContractFile(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingLease(false);
    }
  };

  const openLeaseCreationForApproved = (app: LeaseApplicationResponseDTO) => {
    setCreatingLeaseForApp(app);
    setLeaseRent(app.property.price?.toString() || '');
    setStartDate(new Date());
    const defaultEnd = new Date();
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    setEndDate(defaultEnd);
    setContractFile(null);
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
          Review and manage tenant applications for your properties
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
                    ? "You haven't received any applications yet"
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

                          {/* Actions for Pending */}
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

                          {/* Actions for Approved - Create Lease */}
                          {app.status === 'APPROVED' && (
                            <div className="flex items-center gap-3 pt-2">
                              <Button 
                                className="flex-1"
                                onClick={() => openLeaseCreationForApproved(app)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Create Lease Agreement
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
                ? 'After approval, you can create a lease agreement for this tenant.'
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

      {/* Create Lease Dialog */}
      <Dialog open={!!creatingLeaseForApp} onOpenChange={(open) => {
        if (!open) {
          setCreatingLeaseForApp(null);
          setContractFile(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Lease Agreement</DialogTitle>
            <DialogDescription>
              Set the lease terms for {creatingLeaseForApp?.property.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Property Info */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <img
                src={creatingLeaseForApp?.property.coverImageUrl || '/placeholder.svg'}
                alt={creatingLeaseForApp?.property.title}
                className="h-14 w-14 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-semibold">{creatingLeaseForApp?.property.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Tenant: {creatingLeaseForApp?.tenant.fullName}
                </p>
              </div>
            </div>

            {/* Rent Amount */}
            <div className="space-y-2">
              <Label htmlFor="leaseRent">Monthly Rent ($)</Label>
              <Input
                id="leaseRent"
                type="number"
                value={leaseRent}
                onChange={(e) => setLeaseRent(e.target.value)}
                min={0}
              />
            </div>

            {/* Security Deposit */}
            <div className="space-y-2">
              <Label htmlFor="securityDeposit">Security Deposit ($)</Label>
              <Input
                id="securityDeposit"
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                min={0}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      disabled={(date) => date < startDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Contract Upload */}
            <div className="space-y-2">
              <Label>Contract Document (Optional)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('contract-upload')?.click()}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {contractFile ? contractFile.name : 'Click to upload contract PDF'}
                </p>
              </div>
              <input
                id="contract-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setContractFile(file);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreatingLeaseForApp(null);
              setContractFile(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLease}
              disabled={isCreatingLease || !leaseRent || !securityDeposit}
            >
              {isCreatingLease ? 'Creating...' : 'Create & Send to Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
