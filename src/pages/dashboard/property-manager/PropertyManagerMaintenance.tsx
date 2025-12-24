import { useState } from 'react';
import { format, parseISO } from 'date-fns';
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
import { useAuth } from '@/contexts/AuthContext';
import { getMaintenanceForManager } from '@/lib/mockDatabase';
import { MaintenanceRequest } from '@/types/tenant';
import { toast } from 'sonner';

const statusConfig = {
  open: { label: 'Open', icon: AlertTriangle, className: 'bg-warning/10 text-warning' },
  accepted: { label: 'Accepted', icon: ThumbsUp, className: 'bg-accent/10 text-accent' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-info/10 text-info' },
  scheduled: { label: 'Scheduled', icon: Calendar, className: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-accent/10 text-accent' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-warning/10 text-warning' },
  high: { label: 'High', className: 'bg-orange-500/10 text-orange-500' },
  urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive' },
};

function RejectDialog({ 
  open, 
  onOpenChange, 
  onConfirm 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    onConfirm(reason);
    setReason('');
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
          <Button variant="destructive" onClick={handleSubmit}>
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({ 
  open, 
  onOpenChange, 
  onConfirm 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onConfirm(notes);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Resolved</DialogTitle>
          <DialogDescription>
            Add any notes about the resolution (optional)
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceCard({ request }: { request: MaintenanceRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  
  const statusCfg = statusConfig[request.status];
  const priorityCfg = priorityConfig[request.priority];
  const StatusIcon = statusCfg.icon;

  const handleAccept = () => {
    toast.success('Maintenance request accepted');
  };

  const handleReject = (reason: string) => {
    toast.success('Maintenance request rejected');
    setShowRejectDialog(false);
  };

  const handleResolve = (notes: string) => {
    toast.success('Maintenance request marked as resolved');
    setShowResolveDialog(false);
  };

  const canAcceptOrReject = request.status === 'open';
  const canResolve = ['accepted', 'in_progress', 'scheduled'].includes(request.status);

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
                <h3 className="font-semibold text-lg">{request.title}</h3>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {request.propertyTitle}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {request.tenantName}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Submitted</p>
                <p className="font-medium">
                  {format(parseISO(request.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <p className="text-sm">{request.description}</p>

            {request.images && request.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {request.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Issue ${idx + 1}`}
                    className="h-24 w-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            )}

            {request.scheduledFor && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  Scheduled for{' '}
                  <strong>
                    {format(parseISO(request.scheduledFor), 'MMMM d, yyyy h:mm a')}
                  </strong>
                </span>
              </div>
            )}

            {request.status === 'rejected' && request.rejectionReason && (
              <div className="p-3 bg-destructive/5 rounded-lg">
                <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                <p className="text-sm">{request.rejectionReason}</p>
              </div>
            )}

            {request.notes && request.status === 'completed' && (
              <div className="p-3 bg-accent/5 rounded-lg">
                <p className="text-sm font-medium text-accent">Resolution Note:</p>
                <p className="text-sm">{request.notes}</p>
                {request.resolvedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Resolved on {format(parseISO(request.resolvedAt), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {canAcceptOrReject && (
                <>
                  <Button onClick={handleAccept} size="sm">
                    <ThumbsUp className="h-4 w-4 mr-2" />
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
                      Hide Timeline
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      View Timeline
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-3 pl-4 border-l-2 border-border">
                  {request.timeline.map((event) => {
                    const eventConfig = statusConfig[event.status];
                    const EventIcon = eventConfig.icon;
                    return (
                      <div key={event.id} className="relative pl-4">
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                          <EventIcon className="h-2.5 w-2.5" />
                        </div>
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.timestamp), 'MMM d, yyyy h:mm a')}
                          {event.actor && ` • ${event.actor === 'tenant' ? 'Tenant' : event.actor === 'landlord' ? 'Landlord' : 'Property Manager'}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <RejectDialog 
        open={showRejectDialog} 
        onOpenChange={setShowRejectDialog}
        onConfirm={handleReject}
      />
      <ResolveDialog 
        open={showResolveDialog} 
        onOpenChange={setShowResolveDialog}
        onConfirm={handleResolve}
      />
    </>
  );
}

export default function PropertyManagerMaintenance() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Get maintenance requests for managed properties
  const allRequests = user ? getMaintenanceForManager(user.id) : [];
  
  let filteredRequests = allRequests;

  if (statusFilter !== 'all') {
    filteredRequests = filteredRequests.filter((r) => r.status === statusFilter);
  }

  if (priorityFilter !== 'all') {
    filteredRequests = filteredRequests.filter((r) => r.priority === priorityFilter);
  }

  const openCount = allRequests.filter((r) => r.status === 'open').length;
  const inProgressCount = allRequests.filter((r) => 
    ['accepted', 'in_progress', 'scheduled'].includes(r.status)
  ).length;
  const completedCount = allRequests.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-1">
            {openCount} pending • {inProgressCount} in progress • {completedCount} completed
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <MaintenanceCard key={request.id} request={request} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Requests Found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No maintenance requests for your managed properties yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
