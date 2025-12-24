import { useState, useEffect } from 'react';
import { Eye, Building2, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getPropertiesForManager } from '@/lib/mockDatabase';
import { Property } from '@/types/property';
import { useNavigate } from 'react-router-dom';

export default function PropertyManagerProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (user) {
      setProperties(getPropertiesForManager(user.id));
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'rented':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Managed Properties</h1>
        <p className="text-muted-foreground">
          View properties you've been assigned to manage
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No properties assigned</h3>
            <p className="text-muted-foreground text-center">
              You haven't been assigned to manage any properties yet.
              <br />
              Contact your landlord to be added as a property manager.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={property.thumbnail}
                  alt={property.title}
                  className="h-48 w-full object-cover"
                />
                <Badge 
                  className="absolute top-3 right-3"
                  variant={getStatusColor(property.status)}
                >
                  {property.status}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">{property.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {property.address.city}, {property.address.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {property.bedrooms} bed • {property.bathrooms} bath • {property.size} sqft
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xl font-bold">${property.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Owner: {property.landlord.name}
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => navigate(`/properties/${property.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Property
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
