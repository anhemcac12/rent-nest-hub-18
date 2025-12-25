import { useEffect, useState } from 'react';
import { Building2, FileText, ScrollText, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getLandlordProperties, getApplicationsForLandlord, getLeaseAgreements, getLandlordConversations } from '@/lib/mockDatabase';
import { Property } from '@/types/property';
import { Application } from '@/types/tenant';
import { LeaseAgreement } from '@/types/landlord';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
}

function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trend && <span className="text-green-500 ml-1">{trend}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

export default function LandlordDashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      setProperties(getLandlordProperties(user.id));
      setApplications(getApplicationsForLandlord(user.id));
      setLeases(getLeaseAgreements(user.id));
      const conversations = getLandlordConversations(user.id);
      setUnreadMessages(conversations.reduce((acc, conv) => acc + conv.unreadCount, 0));
    }
  }, [user]);

  const pendingApplications = applications.filter(app => app.status === 'pending' || app.status === 'under_review');
  const activeLeases = leases.filter(lease => lease.status === 'active');
  const availableProperties = properties.filter(prop => prop.status === 'available');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Landlord Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.fullName?.split(' ')[0]}! Here's an overview of your properties.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Properties"
          value={properties.length}
          description={`${availableProperties.length} available`}
          icon={Building2}
        />
        <StatsCard
          title="Pending Applications"
          value={pendingApplications.length}
          description="Awaiting your review"
          icon={FileText}
        />
        <StatsCard
          title="Active Leases"
          value={activeLeases.length}
          description="Current tenants"
          icon={ScrollText}
        />
        <StatsCard
          title="Unread Messages"
          value={unreadMessages}
          description="From tenants"
          icon={MessageSquare}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Applications
            </CardTitle>
            <CardDescription>Applications awaiting your review</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending applications</p>
            ) : (
              <div className="space-y-3">
                {pendingApplications.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{app.property.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={app.status === 'pending' ? 'secondary' : 'outline'}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {pendingApplications.length > 3 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/dashboard/applications')}
                  >
                    View All Applications
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Properties
            </CardTitle>
            <CardDescription>Quick overview of your listings</CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No properties listed yet</p>
                <Button onClick={() => navigate('/dashboard/properties')}>
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 3).map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={property.thumbnail} 
                        alt={property.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm truncate max-w-[180px]">{property.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ${property.price}/mo
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      property.status === 'available' ? 'default' : 
                      property.status === 'rented' ? 'secondary' : 'outline'
                    }>
                      {property.status}
                    </Badge>
                  </div>
                ))}
                {properties.length > 3 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/dashboard/properties')}
                  >
                    View All Properties
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
