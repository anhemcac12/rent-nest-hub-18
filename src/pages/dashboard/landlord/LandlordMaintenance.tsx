import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  XCircle,
  ThumbsUp,
  User,
  Building2,
  Loader2,
  Play,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getMaintenanceForLandlord,
  getMaintenanceRequestDetail,
  getMaintenanceSummary,
  acceptMaintenanceRequest,
  rejectMaintenanceRequest,
  startMaintenanceWork,
  scheduleMaintenanceWork,
  resolveMaintenanceRequest,
  MaintenanceListItem,
  MaintenanceStatus,
  MaintenancePriority,
} from '@/lib/api/maintenanceApi';
import { ImageLightbox } from '@/components/maintenance/ImageLightbox';

const statusConfig: Record<MaintenanceStatus, { label: string; icon: typeof AlertTriangle; className: string }> = {
  OPEN: { label: 'Open', icon: AlertTriangle, className: 'bg-warning/10 text-warning' },
  ACCEPTED: { label: 'Accepted', icon: ThumbsUp, className: 'bg-accent/10 text-accent' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, className: 'bg-info/10 text-info' },
  SCHEDULED: { label: 'Scheduled', icon: Calendar, className: 'bg-primary/10 text-primary' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, className: 'bg-accent/10 text-accent' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, className: 'bg-muted text-muted-foreground' },
};

const priorityConfig: Record<MaintenancePriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  MEDIUM: { label: 'Medium', className: 'bg-warning/10 text-warning' },
  HIGH: { label: 'High', className: 'bg-orange-500/10 text-orange-500' },
  URGENT: { label: 'Urgent', className: 'bg-destructive/10 text-destructive' },
};

function RejectDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  isPending,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Maintenance Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this request
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this request is being rejected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  isPending,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { scheduledFor: string; assignedContractor?: string; notes?: string }) => void;
  isPending: boolean;
}) {
  const [scheduledFor, setScheduledFor] = useState('');
  const [contractor, setContractor] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!scheduledFor) {
      toast.error('Please select a date and time');
      return;
    }
    onConfirm({
      scheduledFor: new Date(scheduledFor).toISOString(),
      assignedContractor: contractor || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
          <DialogDescription>
            Set a date and time for the maintenance work
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="datetime">Date & Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractor">Assigned Contractor (optional)</Label>
            <Input
              id="contractor"
              placeholder="Enter contractor name..."
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  isPending,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { resolutionNotes?: string; actualCost?: number }) => void;
  isPending: boolean;
}) {
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');

  const handleSubmit = () => {
    onConfirm({
      resolutionNotes: notes || undefined,
      actualCost: cost ? parseFloat(cost) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Resolved</DialogTitle>
          <DialogDescription>
            Add resolution details (optional)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Resolution Notes</Label>
            <Textarea
              id="notes"
              placeholder="Describe what was done to resolve the issue..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Actual Cost (optional)</Label>
            <Input
              id="cost"
              type="number"
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceCard({ item }: { item: MaintenanceListItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const statusCfg = statusConfig[item.status];
  const priorityCfg = priorityConfig[item.priority];
  const StatusIcon = statusCfg.icon;

  // Fetch full details when expanded
  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ['maintenance-detail', item.id],
    queryFn: () => getMaintenanceRequestDetail(item.id),
    enabled: isOpen,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['landlord-maintenance'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance-summary'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance-detail', item.id] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => acceptMaintenanceRequest(item.id),
    onSuccess: () => {
      toast.success('Request accepted');
      invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to accept request'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectMaintenanceRequest(item.id, { reason }),
    onSuccess: () => {
      toast.success('Request rejected');
      setShowRejectDialog(false);
      invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to reject request'),
  });

  const startMutation = useMutation({
    mutationFn: () => startMaintenanceWork(item.id),
    onSuccess: () => {
      toast.success('Work started');
      invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to start work'),
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: { scheduledFor: string; assignedContractor?: string; notes?: string }) => 
      scheduleMaintenanceWork(item.id, data),
    onSuccess: () => {
      toast.success('Work scheduled');
      setShowScheduleDialog(false);
      invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to schedule work'),
  });

  const resolveMutation = useMutation({
    mutationFn: (data: { resolutionNotes?: string; actualCost?: number }) => 
      resolveMaintenanceRequest(item.id, data),
    onSuccess: () => {
      toast.success('Request resolved');
      setShowResolveDialog(false);
      invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to resolve request'),
  });

  const canAcceptOrReject = item.status === 'OPEN';
  const canStart = item.status === 'ACCEPTED' || item.status === 'SCHEDULED';
  const canSchedule = item.status === 'ACCEPTED';
  const canResolve = ['ACCEPTED', 'IN_PROGRESS', 'SCHEDULED'].includes(item.status);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" className={statusCfg.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusCfg.label}
                  </Badge>
                  <Badge variant="outline" className={priorityCfg.className}>
                    {priorityCfg.label} Priority
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {item.propertyTitle}
                  </span>
                  {item.tenantName && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {item.tenantName}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Submitted</p>
                <p className="font-medium">
                  {format(parseISO(item.createdAt), 'MMM d, yyyy')}
                </p>
                {item.daysOpen > 0 && (
                  <p className="text-xs">{item.daysOpen} day{item.daysOpen !== 1 ? 's' : ''} open</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {canAcceptOrReject && (
                <>
                  <Button onClick={() => acceptMutation.mutate()} size="sm" disabled={acceptMutation.isPending}>
                    {acceptMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                    Accept
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {canSchedule && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              )}
              {canStart && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Work
                </Button>
              )}
              {canResolve && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowResolveDialog(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
            </div>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      View Details
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {loadingDetails ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : details ? (
                  <>
                    <p className="text-sm">{details.description}</p>

                    {details.images && details.images.length > 0 && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {details.images.map((img, index) => (
                            <img
                              key={img.id}
                              src={img.url}
                              alt={`Maintenance image ${index + 1}`}
                              className="h-24 w-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setLightboxIndex(index)}
                            />
                          ))}
                        </div>
                        {lightboxIndex !== null && (
                          <ImageLightbox
                            images={details.images}
                            initialIndex={lightboxIndex}
                            onClose={() => setLightboxIndex(null)}
                          />
                        )}
                      </>
                    )}

                    {details.scheduledFor && (
                      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-sm">
                          Scheduled for{' '}
                          <strong>
                            {format(parseISO(details.scheduledFor), 'MMMM d, yyyy h:mm a')}
                          </strong>
                        </span>
                      </div>
                    )}

                    {details.assignedContractor && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm"><strong>Contractor:</strong> {details.assignedContractor}</p>
                      </div>
                    )}

                    {details.status === 'REJECTED' && details.rejectionReason && (
                      <div className="p-3 bg-destructive/5 rounded-lg">
                        <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                        <p className="text-sm">{details.rejectionReason}</p>
                      </div>
                    )}

                    {details.notes && details.status === 'COMPLETED' && (
                      <div className="p-3 bg-accent/5 rounded-lg">
                        <p className="text-sm font-medium text-accent">Resolution Note:</p>
                        <p className="text-sm">{details.notes}</p>
                        {details.actualCost && (
                          <p className="text-sm mt-1"><strong>Cost:</strong> ${details.actualCost.toFixed(2)}</p>
                        )}
                        {details.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Resolved on {format(parseISO(details.completedAt), 'MMMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Timeline */}
                    {details.timeline && details.timeline.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-border">
                        {details.timeline.map((event) => {
                          const eventConfig = statusConfig[event.status];
                          const EventIcon = eventConfig?.icon || Clock;
                          return (
                            <div key={event.id} className="relative pl-4">
                              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                                <EventIcon className="h-2.5 w-2.5" />
                              </div>
                              <p className="text-sm font-medium">{event.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(event.timestamp), 'MMM d, yyyy h:mm a')}
                                {event.actorName && ` • ${event.actorName}`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <RejectDialog 
        open={showRejectDialog} 
        onOpenChange={setShowRejectDialog}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
        isPending={rejectMutation.isPending}
      />
      <ScheduleDialog 
        open={showScheduleDialog} 
        onOpenChange={setShowScheduleDialog}
        onConfirm={(data) => scheduleMutation.mutate(data)}
        isPending={scheduleMutation.isPending}
      />
      <ResolveDialog 
        open={showResolveDialog} 
        onOpenChange={setShowResolveDialog}
        onConfirm={(data) => resolveMutation.mutate(data)}
        isPending={resolveMutation.isPending}
      />
    </>
  );
}

export default function LandlordMaintenance() {
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'ALL'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['landlord-maintenance', statusFilter, priorityFilter],
    queryFn: () => getMaintenanceForLandlord({
      status: statusFilter,
      priority: priorityFilter,
    }),
  });

  const { data: summary } = useQuery({
    queryKey: ['maintenance-summary'],
    queryFn: getMaintenanceSummary,
  });

  const requests = data?.content ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-1">
            {summary?.open ?? 0} pending • {summary?.inProgress ?? 0} in progress • {summary?.completed ?? 0} completed
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MaintenanceStatus | 'ALL')}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as MaintenancePriority | 'ALL')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <MaintenanceCard key={request.id} item={request} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Requests Found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'No maintenance requests from tenants yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
