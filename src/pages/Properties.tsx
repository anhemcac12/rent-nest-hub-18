import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, List, Star, Heart, MapPin, Bed, Bath, Square, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PROPERTY_TYPES, AMENITIES } from '@/types/property';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { propertyApi, PropertySummaryDTO, PropertySearchParams } from '@/lib/api/propertyApi';

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
  const [draftPriceRange, setDraftPriceRange] = useState([0, 6000]);
  const [draftSelectedBedrooms, setDraftSelectedBedrooms] = useState<string>('any');
  
  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    priceRange: [0, 6000],
    selectedBedrooms: 'any',
  });

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
      if (appliedFilters.priceRange[1] < 6000) {
        params.maxRent = appliedFilters.priceRange[1];
      }
      
      // Add bedrooms filter
      if (appliedFilters.selectedBedrooms !== 'any') {
        const beds = parseInt(appliedFilters.selectedBedrooms);
        params.minRooms = beds;
        if (beds < 4) {
          params.maxRooms = beds;
        }
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

  // Load user's saved properties from localStorage (will integrate with API later)
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`saved_properties_${user.id}`);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } else {
      setFavorites([]);
    }
  }, [user]);

  const applyFilters = () => {
    setAppliedFilters({
      priceRange: draftPriceRange,
      selectedBedrooms: draftSelectedBedrooms,
    });
    setCurrentPage(0);
  };

  const toggleFavorite = (id: string) => {
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }
    
    let newFavorites: string[];
    if (favorites.includes(id)) {
      newFavorites = favorites.filter(f => f !== id);
      toast.success('Removed from saved properties');
    } else {
      newFavorites = [...favorites, id];
      toast.success('Added to saved properties');
    }
    setFavorites(newFavorites);
    localStorage.setItem(`saved_properties_${user.id}`, JSON.stringify(newFavorites));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDraftPriceRange([0, 6000]);
    setDraftSelectedBedrooms('any');
    setAppliedFilters({
      priceRange: [0, 6000],
      selectedBedrooms: 'any',
    });
    setCurrentPage(0);
  };

  const hasActiveFilters = appliedFilters.priceRange[0] > 0 || appliedFilters.priceRange[1] < 6000 || appliedFilters.selectedBedrooms !== 'any';
  
  const hasDraftChanges = 
    draftPriceRange[0] !== appliedFilters.priceRange[0] ||
    draftPriceRange[1] !== appliedFilters.priceRange[1] ||
    draftSelectedBedrooms !== appliedFilters.selectedBedrooms;

  const FiltersContent = () => (
    <div className="space-y-5">
      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Price Range</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              value={draftPriceRange[0]}
              onChange={(e) => setDraftPriceRange([Number(e.target.value), draftPriceRange[1]])}
              className="pl-7 h-10 text-sm"
              placeholder="Min"
            />
          </div>
          <span className="text-muted-foreground">—</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              value={draftPriceRange[1]}
              onChange={(e) => setDraftPriceRange([draftPriceRange[0], Number(e.target.value)])}
              className="pl-7 h-10 text-sm"
              placeholder="Max"
            />
          </div>
        </div>
        <Slider 
          value={draftPriceRange} 
          onValueChange={setDraftPriceRange} 
          min={0} 
          max={6000} 
          step={100} 
        />
      </div>

      {/* Room Number */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Room Number</Label>
        <div className="flex gap-2">
          {['any', '1', '2', '3', '4'].map(num => (
            <button
              key={num}
              onClick={() => setDraftSelectedBedrooms(num)}
              className={cn(
                'flex-1 py-2 text-sm rounded-lg border transition-all',
                draftSelectedBedrooms === num
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary hover:bg-primary/5'
              )}
            >
              {num === 'any' ? 'Any' : num === '4' ? '4+' : num}
            </button>
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
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden md:block w-72 shrink-0">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-foreground mb-6">Filters</h2>
                <FiltersContent />
              </div>
            </aside>

            {/* Properties Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{properties.length}</span> of {totalElements} properties
                </p>
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
                            <span className="text-xs text-muted-foreground capitalize">{property.type}</span>
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
