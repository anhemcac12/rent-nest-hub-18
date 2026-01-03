import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, MapPin, Undo2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { leaseApplicationApi, LeaseApplicationResponseDTO, LeaseApplicationStatus } from '@/lib/api/leaseApplicationApi';
import { ApiError } from '@/lib/api/client';
import { toast } from 'sonner';

// Map backend status to display config
const statusConfig: Record<LeaseApplicationStatus, { label: string; icon: typeof Clock; className: string }> = {
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning border-warning/30' },
  APPROVED: { label: 'Approved', icon: CheckCircle2, className: 'bg-accent/10 text-accent border-accent/30' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  CANCELLED: { label: 'Cancelled', icon: Undo2, className: 'bg-muted text-muted-foreground border-muted-foreground/30' },
};

function ApplicationCard({ 
  application, 
  onCancel 
}: { 
  application: LeaseApplicationResponseDTO; 
  onCancel: () => void;
}) {
  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <img 
            src={application.property.coverImageUrl || '/placeholder.svg'} 
            alt={application.property.title} 
            className="w-full sm:w-40 h-28 object-cover rounded-lg" 
          />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className={config.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />{config.label}
                </Badge>
                <Link to={`/properties/${application.property.id}`}>
                  <h3 className="font-semibold text-lg mt-2 hover:text-primary transition-colors">
                    {application.property.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{application.property.address}
                </p>
              </div>
              <p className="text-lg font-bold text-primary shrink-0">
                ${application.property.rentAmount?.toLocaleString() || 'N/A'}/mo
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Applied: {format(parseISO(application.applicationDate), 'MMM d, yyyy')}</span>
            </div>
            {application.message && (
              <p className="text-sm p-3 bg-muted rounded-lg line-clamp-2">{application.message}</p>
            )}
            <div className="flex items-center gap-2">
              {application.status === 'PENDING' && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel Application
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantApplications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [applications, setApplications] = useState<LeaseApplicationResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await leaseApplicationApi.getMyApplications();
      setApplications(data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load applications');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const handleCancel = async (applicationId: number) => {
    try {
      await leaseApplicationApi.cancelApplication(applicationId);
      toast.success('Application cancelled');
      fetchApplications();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to cancel application');
      }
    }
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter((a) => a.status === status.toUpperCase());
  };

  const tabs = [
    { value: 'all', label: 'All', count: applications.length },
    { value: 'pending', label: 'Pending', count: applications.filter((a) => a.status === 'PENDING').length },
    { value: 'approved', label: 'Approved', count: applications.filter((a) => a.status === 'APPROVED').length },
    { value: 'rejected', label: 'Rejected', count: applications.filter((a) => a.status === 'REJECTED').length },
  ];

  const filteredApplications = filterApplications(activeTab);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-1">Track the status of your property applications</p>
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
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-muted-foreground mt-1">Track the status of your property applications</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.label}<Badge variant="secondary" className="h-5 px-1.5">{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((application) => (
              <ApplicationCard 
                key={application.id} 
                application={application} 
                onCancel={() => handleCancel(application.id)} 
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Applications</h3>
                <p className="text-muted-foreground mb-4">You haven't submitted any applications yet</p>
                <Link to="/properties"><Button>Browse Properties</Button></Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
