import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Eye, Edit, Users, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyFormModal } from '@/components/landlord/PropertyFormModal';
import { PropertyManagersModal } from '@/components/landlord/PropertyManagersModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { propertyApi, PropertySummaryDTO } from '@/lib/api/propertyApi';
import { toast } from 'sonner';

export default function LandlordProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertySummaryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [managersPropertyId, setManagersPropertyId] = useState<number | null>(null);

  const fetchProperties = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await propertyApi.getPropertiesByLandlord(Number(user.id));
      setProperties(data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  const handleDeleteProperty = async (propertyId: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await propertyApi.deleteProperty(propertyId);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast.error('Failed to delete property');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental properties
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first rental property
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={property.coverImageUrl || '/placeholder.svg'}
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
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{property.title}</CardTitle>
                    <CardDescription className="truncate">
                      {property.address}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/properties/${property.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Listing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingPropertyId(property.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Property
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setManagersPropertyId(property.id)}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Managers
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Property
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {property.bedrooms} bed • {property.bathrooms} bath • {property.size} sqft
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xl font-bold">${property.rentAmount}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Property Modal */}
      <PropertyFormModal
        open={showAddModal || editingPropertyId !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingPropertyId(null);
        }}
        propertyId={editingPropertyId}
        onSave={fetchProperties}
      />

      {/* Property Managers Modal */}
      {managersPropertyId && (
        <PropertyManagersModal
          open={!!managersPropertyId}
          onClose={() => setManagersPropertyId(null)}
          propertyId={managersPropertyId}
        />
      )}
    </div>
  );
}
