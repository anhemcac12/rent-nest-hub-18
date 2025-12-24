import { useState, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  XCircle,
  ThumbsUp,
  Upload,
  X,
  Image as ImageIcon,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { mockMaintenanceRequests, mockRentals } from '@/data/mockTenant';
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

function MaintenanceCard({ request }: { request: MaintenanceRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const statusCfg = statusConfig[request.status];
  const priorityCfg = priorityConfig[request.priority];
  const StatusIcon = statusCfg.icon;

  return (
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
              <p className="text-sm text-muted-foreground">{request.propertyTitle}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Submitted</p>
              <p className="font-medium">
                {format(parseISO(request.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <p className="text-sm">{request.description}</p>

          {/* Display images if any */}
          {request.images && request.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {request.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Issue ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border"
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
  );
}

function NewRequestDialog() {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRental = mockRentals.find((r) => r.status === 'active');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Maintenance request submitted');
    setImages([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
            <DialogDescription>
              Describe the issue and we'll notify your landlord
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select defaultValue={activeRental?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {mockRentals
                    .filter((r) => r.status === 'active')
                    .map((rental) => (
                      <SelectItem key={rental.id} value={rental.id}>
                        {rental.property.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input id="title" placeholder="Brief description of the issue" required />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about the issue..."
                rows={4}
                required
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Photos (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Upload ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Upload photos to help describe the issue
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Maintenance() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  let filteredRequests = mockMaintenanceRequests;

  if (statusFilter !== 'all') {
    filteredRequests = filteredRequests.filter((r) => r.status === statusFilter);
  }

  if (priorityFilter !== 'all') {
    filteredRequests = filteredRequests.filter((r) => r.priority === priorityFilter);
  }

  const openCount = mockMaintenanceRequests.filter((r) => !['completed', 'rejected'].includes(r.status)).length;
  const completedCount = mockMaintenanceRequests.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-1">
            {openCount} open • {completedCount} completed
          </p>
        </div>
        <NewRequestDialog />
      </div>

      {/* Filters */}
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

      {/* Requests List */}
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
                  : "You haven't submitted any maintenance requests yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
