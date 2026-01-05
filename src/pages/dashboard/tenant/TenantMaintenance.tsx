import { useState, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Loader2,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getMyMaintenanceRequests,
  getMaintenanceRequestDetail,
  createMaintenanceRequest,
  cancelMaintenanceRequest,
  uploadMaintenanceImage,
  MaintenanceListItem,
  MaintenanceStatus,
  MaintenancePriority,
} from '@/lib/api/maintenanceApi';
import { leaseApi } from '@/lib/api/leaseApi';
import { ImageLightbox } from '@/components/maintenance/ImageLightbox';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image

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

function MaintenanceCard({ 
  item, 
  onCancel 
}: { 
  item: MaintenanceListItem;
  onCancel: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const statusCfg = statusConfig[item.status];
  const priorityCfg = priorityConfig[item.priority];
  const StatusIcon = statusCfg.icon;

  // Fetch full details when expanded
  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ['maintenance-detail', item.id],
    queryFn: () => getMaintenanceRequestDetail(item.id),
    enabled: isOpen,
  });

  const canCancel = item.status === 'OPEN';

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
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.propertyTitle}</p>
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

          {canCancel && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onCancel(item.id)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
          )}

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

                  {/* Display images if any */}
                  {details.images && details.images.length > 0 && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {details.images.map((img, index) => (
                          <img
                            key={img.id}
                            src={img.url}
                            alt={`Maintenance image ${index + 1}`}
                            className="h-20 w-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
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
  );
}

function NewRequestDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [leaseId, setLeaseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch active leases
  const { data: leases = [], isLoading: loadingLeases } = useQuery({
    queryKey: ['my-leases'],
    queryFn: leaseApi.getMyLeases,
  });

  const activeLeases = leases.filter(l => l.status === 'ACTIVE');

  const resetForm = () => {
    setLeaseId('');
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_IMAGES - imageFiles.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    if (filesToAdd.length > remainingSlots) {
      toast.info(`Only added ${remainingSlots} images (max ${MAX_IMAGES})`);
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaseId) {
      toast.error('Please select a property');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create the maintenance request first (without images)
      const newRequest = await createMaintenanceRequest({
        leaseId: parseInt(leaseId),
        title,
        description,
        priority,
        imageIds: [],
      });

      // Step 2: Upload images to the created request
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map((file) => 
          uploadMaintenanceImage(newRequest.id, file)
        );
        
        try {
          await Promise.all(uploadPromises);
        } catch (uploadError) {
          console.error('Some images failed to upload:', uploadError);
          toast.warning('Request created but some images failed to upload');
        }
      }

      toast.success('Maintenance request submitted');
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setIsUploading(false);
    }
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
              <Select value={leaseId} onValueChange={setLeaseId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLeases ? "Loading..." : "Select property"} />
                </SelectTrigger>
                <SelectContent>
                  {activeLeases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id.toString()}>
                      {lease.propertyTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeLeases.length === 0 && !loadingLeases && (
                <p className="text-xs text-muted-foreground">No active leases found</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input 
                id="title" 
                placeholder="Brief description of the issue" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as MaintenancePriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about the issue..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Photos (optional, max {MAX_IMAGES})</Label>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((img, index) => (
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
                {imageFiles.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                )}
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
                {imageFiles.length}/{MAX_IMAGES} photos • Max 5MB each
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TenantMaintenance() {
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'ALL'>('ALL');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-maintenance', statusFilter, priorityFilter],
    queryFn: () => getMyMaintenanceRequests({
      status: statusFilter,
      priority: priorityFilter,
    }),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelMaintenanceRequest,
    onSuccess: () => {
      toast.success('Request cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-maintenance'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request');
    },
  });

  const requests = data?.content ?? [];
  const openCount = requests.filter((r) => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(r.status)).length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
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
            {openCount} open • {completedCount} completed
          </p>
        </div>
        <NewRequestDialog onSuccess={() => refetch()} />
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
            <MaintenanceCard 
              key={request.id} 
              item={request} 
              onCancel={(id) => cancelMutation.mutate(id)}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Requests Found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== 'ALL' || priorityFilter !== 'ALL'
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
