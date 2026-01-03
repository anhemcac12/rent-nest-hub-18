import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, List, Heart, MapPin, Bed, Bath, Square, X, Loader2, Calendar, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PROPERTY_TYPES, AMENITIES } from '@/types/property';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { propertyApi, PropertySummaryDTO, PropertySearchParams } from '@/lib/api/propertyApi';
import { savedPropertiesApi } from '@/lib/api/savedPropertiesApi';

const PROPERTY_TYPE_OPTIONS = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'ROOM', label: 'Room' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
];

interface FilterState {
  priceRange: [number, number];
  selectedBedrooms: string;
  selectedBathrooms: string;
  propertyType: string;
  sizeRange: [number, number];
  furnished: boolean | null;
  petFriendly: boolean | null;
  selectedAmenities: string[];
  city: string;
  availableFrom: Date | undefined;
}

const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 10000],
  selectedBedrooms: 'any',
  selectedBathrooms: 'any',
  propertyType: 'any',
  sizeRange: [0, 5000],
  furnished: null,
  petFriendly: null,
  selectedAmenities: [],
  city: '',
  availableFrom: undefined,
};

export default function Properties() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [properties, setProperties] = useState<PropertySummaryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Draft filter state (before applying)
  const [draftFilters, setDraftFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  
  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });

  // Fetch properties from API
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: PropertySearchParams = {
        page: currentPage,
        size: 12,
      };
      
      // Add search
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Add price filters
      if (appliedFilters.priceRange[0] > 0) {
        params.minRent = appliedFilters.priceRange[0];
      }
      if (appliedFilters.priceRange[1] < 10000) {
        params.maxRent = appliedFilters.priceRange[1];
      }
      
      // Add bedrooms filter
      if (appliedFilters.selectedBedrooms !== 'any') {
        const beds = parseInt(appliedFilters.selectedBedrooms);
        params.minBedrooms = beds;
        if (beds < 4) {
          params.maxBedrooms = beds;
        }
      }
      
      // Add bathrooms filter
      if (appliedFilters.selectedBathrooms !== 'any') {
        const baths = parseInt(appliedFilters.selectedBathrooms);
        params.minBathrooms = baths;
        if (baths < 4) {
          params.maxBathrooms = baths;
        }
      }
      
      // Add property type filter
      if (appliedFilters.propertyType !== 'any') {
        params.type = appliedFilters.propertyType;
      }
      
      // Add size filters
      if (appliedFilters.sizeRange[0] > 0) {
        params.minSize = appliedFilters.sizeRange[0];
      }
      if (appliedFilters.sizeRange[1] < 5000) {
        params.maxSize = appliedFilters.sizeRange[1];
      }
      
      // Add furnished filter
      if (appliedFilters.furnished !== null) {
        params.furnished = appliedFilters.furnished;
      }
      
      // Add pet friendly filter
      if (appliedFilters.petFriendly !== null) {
        params.petFriendly = appliedFilters.petFriendly;
      }
      
      // Add amenities filter
      if (appliedFilters.selectedAmenities.length > 0) {
        params.amenities = appliedFilters.selectedAmenities.join(',');
      }
      
      // Add city filter
      if (appliedFilters.city) {
        params.city = appliedFilters.city;
      }
      
      // Add available from filter
      if (appliedFilters.availableFrom) {
        params.availableFrom = format(appliedFilters.availableFrom, 'yyyy-MM-dd');
      }
      
      // Add sorting
      switch (sortBy) {
        case 'price_asc':
          params.sort = 'rentAmount,asc';
          break;
        case 'price_desc':
          params.sort = 'rentAmount,desc';
          break;
        case 'newest':
          params.sort = 'createdAt,desc';
          break;
        case 'rating':
          params.sort = 'rating,desc';
          break;
        case 'popular':
          params.sort = 'views,desc';
          break;
        case 'size_desc':
          params.sort = 'size,desc';
          break;
        case 'size_asc':
          params.sort = 'size,asc';
          break;
      }
      
      const response = await propertyApi.searchProperties(params);
      setProperties(response.content);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, appliedFilters, sortBy, currentPage]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Load user's saved properties from API
  useEffect(() => {
    const loadSavedProperties = async () => {
      if (user && isAuthenticated) {
        try {
          const savedProperties = await savedPropertiesApi.getSavedProperties();
          setFavorites(savedProperties.map(sp => String(sp.propertyId)));
        } catch (error) {
          console.error('Failed to load saved properties:', error);
        }
      } else {
        setFavorites([]);
      }
    };
    loadSavedProperties();
  }, [user, isAuthenticated]);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentPage(0);
  };

  const toggleFavorite = async (id: string) => {
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }
    
    try {
      if (favorites.includes(id)) {
        await savedPropertiesApi.unsaveProperty(Number(id));
        setFavorites(favorites.filter(f => f !== id));
        toast.success('Removed from saved properties');
      } else {
        await savedPropertiesApi.saveProperty(Number(id));
        setFavorites([...favorites, id]);
        toast.success('Added to saved properties');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update saved properties';
      toast.error(message);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDraftFilters({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
    setCurrentPage(0);
  };

  const hasActiveFilters = 
    appliedFilters.priceRange[0] > 0 || 
    appliedFilters.priceRange[1] < 10000 || 
    appliedFilters.selectedBedrooms !== 'any' ||
    appliedFilters.selectedBathrooms !== 'any' ||
    appliedFilters.propertyType !== 'any' ||
    appliedFilters.sizeRange[0] > 0 ||
    appliedFilters.sizeRange[1] < 5000 ||
    appliedFilters.furnished !== null ||
    appliedFilters.petFriendly !== null ||
    appliedFilters.selectedAmenities.length > 0 ||
    appliedFilters.city !== '' ||
    appliedFilters.availableFrom !== undefined;
  
  const hasDraftChanges = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const toggleAmenity = (amenity: string) => {
    setDraftFilters(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter(a => a !== amenity)
        : [...prev.selectedAmenities, amenity]
    }));
  };

  const filtersContent = (
    <div className="space-y-6">
      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Property Type</Label>
        <Select 
          value={draftFilters.propertyType} 
          onValueChange={(value) => setDraftFilters(prev => ({ ...prev, propertyType: value }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Type</SelectItem>
            {PROPERTY_TYPE_OPTIONS.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">City</Label>
        <Input
          placeholder="Enter city..."
          value={draftFilters.city}
          onChange={(e) => setDraftFilters(prev => ({ ...prev, city: e.target.value }))}
          className="h-10"
        />
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Price Range</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              value={draftFilters.priceRange[0]}
              onChange={(e) => setDraftFilters(prev => ({ ...prev, priceRange: [Number(e.target.value), prev.priceRange[1]] }))}
              className="pl-7 h-10 text-sm"
              placeholder="Min"
            />
          </div>
          <span className="text-muted-foreground">—</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              value={draftFilters.priceRange[1]}
              onChange={(e) => setDraftFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], Number(e.target.value)] }))}
              className="pl-7 h-10 text-sm"
              placeholder="Max"
            />
          </div>
        </div>
        <Slider 
          value={draftFilters.priceRange} 
          onValueChange={(value) => setDraftFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
          min={0} 
          max={10000} 
          step={100} 
        />
      </div>

      {/* Bedrooms */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Bedrooms</Label>
        <div className="flex gap-2">
          {['any', '1', '2', '3', '4'].map(num => (
            <button
              key={num}
              onClick={() => setDraftFilters(prev => ({ ...prev, selectedBedrooms: num }))}
              className={cn(
                'flex-1 py-2 text-sm rounded-lg border transition-all',
                draftFilters.selectedBedrooms === num
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary hover:bg-primary/5'
              )}
            >
              {num === 'any' ? 'Any' : num === '4' ? '4+' : num}
            </button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Bathrooms</Label>
        <div className="flex gap-2">
          {['any', '1', '2', '3', '4'].map(num => (
            <button
              key={num}
              onClick={() => setDraftFilters(prev => ({ ...prev, selectedBathrooms: num }))}
              className={cn(
                'flex-1 py-2 text-sm rounded-lg border transition-all',
                draftFilters.selectedBathrooms === num
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary hover:bg-primary/5'
              )}
            >
              {num === 'any' ? 'Any' : num === '4' ? '4+' : num}
            </button>
          ))}
        </div>
      </div>

      {/* Size Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Size (sqft)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={draftFilters.sizeRange[0]}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, sizeRange: [Number(e.target.value), prev.sizeRange[1]] }))}
            className="h-10 text-sm"
            placeholder="Min"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            value={draftFilters.sizeRange[1]}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, sizeRange: [prev.sizeRange[0], Number(e.target.value)] }))}
            className="h-10 text-sm"
            placeholder="Max"
          />
        </div>
        <Slider 
          value={draftFilters.sizeRange} 
          onValueChange={(value) => setDraftFilters(prev => ({ ...prev, sizeRange: value as [number, number] }))}
          min={0} 
          max={5000} 
          step={50} 
        />
      </div>

      {/* Available From */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Available From</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-10',
                !draftFilters.availableFrom && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {draftFilters.availableFrom ? format(draftFilters.availableFrom, 'PPP') : 'Any date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={draftFilters.availableFrom}
              onSelect={(date) => setDraftFilters(prev => ({ ...prev, availableFrom: date }))}
              initialFocus
              className="p-3 pointer-events-auto"
            />
            {draftFilters.availableFrom && (
              <div className="p-3 pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraftFilters(prev => ({ ...prev, availableFrom: undefined }))}
                  className="w-full"
                >
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Furnished & Pet Friendly */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">Furnished</Label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDraftFilters(prev => ({ ...prev, furnished: prev.furnished === null ? true : prev.furnished === true ? false : null }))}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-all',
                draftFilters.furnished === null && 'bg-muted',
                draftFilters.furnished === true && 'bg-primary text-primary-foreground border-primary',
                draftFilters.furnished === false && 'bg-destructive/10 text-destructive border-destructive/30'
              )}
            >
              {draftFilters.furnished === null ? 'Any' : draftFilters.furnished ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">Pet Friendly</Label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDraftFilters(prev => ({ ...prev, petFriendly: prev.petFriendly === null ? true : prev.petFriendly === true ? false : null }))}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-all',
                draftFilters.petFriendly === null && 'bg-muted',
                draftFilters.petFriendly === true && 'bg-primary text-primary-foreground border-primary',
                draftFilters.petFriendly === false && 'bg-destructive/10 text-destructive border-destructive/30'
              )}
            >
              {draftFilters.petFriendly === null ? 'Any' : draftFilters.petFriendly ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Amenities</Label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {AMENITIES.map(amenity => (
            <label
              key={amenity}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm',
                draftFilters.selectedAmenities.includes(amenity)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Checkbox
                checked={draftFilters.selectedAmenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <span className="truncate">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 space-y-2 border-t border-border">
        <Button 
          onClick={applyFilters} 
          className="w-full"
          disabled={!hasDraftChanges}
        >
          <Search className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="w-full text-muted-foreground">
            <X className="mr-2 h-4 w-4" /> Clear All
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container-custom">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by city, state, or property name..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && fetchProperties()}
                className="pl-10 h-12" 
              />
            </div>
            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="size_desc">Largest First</SelectItem>
                  <SelectItem value="size_asc">Smallest First</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={cn('p-3', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={cn('p-3', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                  <List className="h-5 w-5" />
                </button>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 md:hidden">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
              {filtersContent}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden md:block w-80 shrink-0">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h2 className="font-semibold text-foreground mb-6">Filters</h2>
                {filtersContent}
              </div>
            </aside>

            {/* Properties Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{properties.length}</span> of {totalElements} properties
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="mr-1 h-3 w-3" /> Clear filters
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search criteria</p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </div>
              ) : (
                <div className={cn(viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4')}>
                  {properties.map(property => (
                    <Card key={property.id} className={cn('overflow-hidden card-hover', viewMode === 'list' && 'flex flex-row')}>
                      <Link to={`/properties/${property.id}`} className={cn('block', viewMode === 'list' && 'flex')}>
                        <div className={cn('relative overflow-hidden bg-muted', viewMode === 'grid' ? 'aspect-[4/3]' : 'w-64 h-48 shrink-0')}>
                          <img 
                            src={property.coverImageUrl || '/placeholder.svg'} 
                            alt={property.title} 
                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                          {property.featured && <span className="absolute top-3 left-3 badge-featured">Featured</span>}
                          {property.isNew && <span className="absolute top-3 left-3 badge-new">New</span>}
                          <button 
                            onClick={e => {
                              e.preventDefault();
                              toggleFavorite(String(property.id));
                            }} 
                            className={cn('absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-colors', favorites.includes(String(property.id)) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive')}
                          >
                            <Heart className={cn('h-5 w-5', favorites.includes(String(property.id)) && 'fill-current')} />
                          </button>
                        </div>
                        <CardContent className={cn('p-4', viewMode === 'list' && 'flex-1')}>
                          <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{property.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            {property.address}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {property.bedrooms}</span>
                            <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {property.bathrooms}</span>
                            <span className="flex items-center gap-1"><Square className="h-4 w-4" /> {property.size} sqft</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">${property.rentAmount.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                            <span className="text-xs text-muted-foreground capitalize">{property.type.toLowerCase()}</span>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}