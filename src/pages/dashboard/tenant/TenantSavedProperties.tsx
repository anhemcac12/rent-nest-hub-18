import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square, Star, X, ArrowUpDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { savedPropertiesApi, SavedPropertyResponse } from '@/lib/api/savedPropertiesApi';
import { toast } from 'sonner';

export default function SavedProperties() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [savedProperties, setSavedProperties] = useState<SavedPropertyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    const loadSavedProperties = async () => {
      if (user && isAuthenticated) {
        setIsLoading(true);
        try {
          const properties = await savedPropertiesApi.getSavedProperties();
          setSavedProperties(properties);
        } catch (error) {
          console.error('Failed to load saved properties:', error);
          toast.error('Failed to load saved properties');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadSavedProperties();
  }, [user, isAuthenticated]);

  const sortedProperties = [...savedProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return (a.property?.price || 0) - (b.property?.price || 0);
      case 'price_desc':
        return (b.property?.price || 0) - (a.property?.price || 0);
      case 'rating':
        return 0; // Rating not available in SavedPropertyDTO
      case 'date':
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      default:
        return 0;
    }
  });

  const handleRemove = async (propertyId: number) => {
    if (!user) return;
    try {
      await savedPropertiesApi.unsaveProperty(propertyId);
      setSavedProperties(savedProperties.filter((sp) => sp.propertyId !== propertyId));
      toast.success('Property removed from saved');
    } catch (error) {
      console.error('Failed to remove property:', error);
      toast.error('Failed to remove property');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Saved Properties</h1>
          <p className="text-muted-foreground mt-1">
            {savedProperties.length} properties in your wishlist
          </p>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date Saved</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProperties.map((savedProperty) => {
            const property = savedProperty.property;
            if (!property) return null;
            
            return (
              <Card key={savedProperty.id} className="group overflow-hidden">
                <div className="relative">
                  <img src={property.coverImageUrl || '/placeholder.svg'} alt={property.title} className="w-full h-48 object-cover" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={() => handleRemove(savedProperty.propertyId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {property.status !== 'available' && (
                    <Badge className="absolute top-3 left-3 bg-destructive">
                      {property.status === 'rented' ? 'Rented' : 'Pending'}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xl font-bold text-primary">
                        ${property.price?.toLocaleString() || 0}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </p>
                    </div>
                    <Link to={`/properties/${property.id}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                        {property.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.city}, {property.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms}</span>
                    <span className="flex items-center gap-1"><Square className="h-4 w-4" />{property.size} sqft</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link to={`/properties/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">No Saved Properties</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't saved any properties yet. Browse listings and click the heart icon to save properties you're interested in.
            </p>
            <Link to="/properties"><Button>Browse Properties</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}