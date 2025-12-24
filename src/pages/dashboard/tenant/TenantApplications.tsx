import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, MapPin, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { getApplications, withdrawApplication } from '@/lib/mockDatabase';
import { Application } from '@/types/tenant';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning border-warning/30' },
  under_review: { label: 'Under Review', icon: AlertCircle, className: 'bg-info/10 text-info border-info/30' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-accent/10 text-accent border-accent/30' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  withdrawn: { label: 'Withdrawn', icon: Undo2, className: 'bg-muted text-muted-foreground border-muted-foreground/30' },
};

function ApplicationCard({ application, onWithdraw }: { application: Application; onWithdraw: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <img src={application.property.thumbnail} alt={application.property.title} className="w-full sm:w-40 h-28 object-cover rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className={config.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />{config.label}
                </Badge>
                <Link to={`/properties/${application.propertyId}`}>
                  <h3 className="font-semibold text-lg mt-2 hover:text-primary transition-colors">{application.property.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{application.property.address.city}, {application.property.address.state}
                </p>
              </div>
              <p className="text-lg font-bold text-primary shrink-0">${application.property.price.toLocaleString()}/mo</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Applied: {format(parseISO(application.appliedAt), 'MMM d, yyyy')}</span>
              <span>Updated: {format(parseISO(application.updatedAt), 'MMM d, yyyy')}</span>
            </div>
            {application.notes && <p className="text-sm p-3 bg-muted rounded-lg">{application.notes}</p>}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isOpen ? <><ChevronUp className="h-4 w-4 mr-1" />Hide Timeline</> : <><ChevronDown className="h-4 w-4 mr-1" />View Timeline</>}
                  </Button>
                </CollapsibleTrigger>
                {application.status === 'pending' && (
                  <Button variant="outline" size="sm" onClick={onWithdraw}>Withdraw Application</Button>
                )}
              </div>
              <CollapsibleContent className="mt-4">
                <div className="space-y-3 pl-4 border-l-2 border-border">
                  {application.timeline.map((event) => {
                    const eventConfig = statusConfig[event.status];
                    const EventIcon = eventConfig.icon;
                    return (
                      <div key={event.id} className="relative pl-4">
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                          <EventIcon className="h-2.5 w-2.5" />
                        </div>
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(event.timestamp), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantApplications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (user) {
      setApplications(getApplications(user.id));
    }
  }, [user]);

  const handleWithdraw = (applicationId: string) => {
    if (!user) return;
    withdrawApplication(user.id, applicationId);
    setApplications(getApplications(user.id));
    toast.success('Application withdrawn');
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter((a) => a.status === status);
  };

  const tabs = [
    { value: 'all', label: 'All', count: applications.length },
    { value: 'pending', label: 'Pending', count: applications.filter((a) => a.status === 'pending').length },
    { value: 'under_review', label: 'Under Review', count: applications.filter((a) => a.status === 'under_review').length },
    { value: 'approved', label: 'Approved', count: applications.filter((a) => a.status === 'approved').length },
    { value: 'rejected', label: 'Rejected', count: applications.filter((a) => a.status === 'rejected').length },
  ];

  const filteredApplications = filterApplications(activeTab);

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
              <ApplicationCard key={application.id} application={application} onWithdraw={() => handleWithdraw(application.id)} />
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
