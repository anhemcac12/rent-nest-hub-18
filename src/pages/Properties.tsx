import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, List, Star, Heart, MapPin, Bed, Bath, Square, X } from 'lucide-react';
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
import { mockProperties } from '@/data/mockProperties';
import { PROPERTY_TYPES, AMENITIES } from '@/types/property';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedProperties, saveProperty, unsaveProperty } from '@/lib/mockDatabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Properties() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Draft filter state (before applying)
  const [draftPriceRange, setDraftPriceRange] = useState([0, 6000]);
  const [draftSelectedTypes, setDraftSelectedTypes] = useState<string[]>([]);
  const [draftSelectedBedrooms, setDraftSelectedBedrooms] = useState<string>('any');
  const [draftSelectedAmenities, setDraftSelectedAmenities] = useState<string[]>([]);
  
  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    priceRange: [0, 6000],
    selectedTypes: [] as string[],
    selectedBedrooms: 'any',
    selectedAmenities: [] as string[],
  });

  // Load user's saved properties
  useEffect(() => {
    if (user) {
      setFavorites(getSavedProperties(user.id));
    } else {
      setFavorites([]);
    }
  }, [user]);

  const applyFilters = () => {
    setAppliedFilters({
      priceRange: draftPriceRange,
      selectedTypes: draftSelectedTypes,
      selectedBedrooms: draftSelectedBedrooms,
      selectedAmenities: draftSelectedAmenities,
    });
  };

  const filteredProperties = useMemo(() => {
    let result = [...mockProperties];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(query) || p.address.city.toLowerCase().includes(query) || p.address.state.toLowerCase().includes(query));
    }

    // Price filter
    result = result.filter(p => p.price >= appliedFilters.priceRange[0] && p.price <= appliedFilters.priceRange[1]);

    // Type filter
    if (appliedFilters.selectedTypes.length > 0) {
      result = result.filter(p => appliedFilters.selectedTypes.includes(p.type));
    }

    // Bedrooms filter
    if (appliedFilters.selectedBedrooms !== 'any') {
      const beds = parseInt(appliedFilters.selectedBedrooms);
      result = result.filter(p => beds === 4 ? p.bedrooms >= 4 : p.bedrooms === beds);
    }

    // Amenities filter
    if (appliedFilters.selectedAmenities.length > 0) {
      result = result.filter(p => appliedFilters.selectedAmenities.every(a => p.amenities.includes(a)));
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return result;
  }, [searchQuery, appliedFilters, sortBy]);

  const toggleFavorite = (id: string) => {
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }
    
    if (favorites.includes(id)) {
      unsaveProperty(user.id, id);
      setFavorites(prev => prev.filter(f => f !== id));
      toast.success('Removed from saved properties');
    } else {
      saveProperty(user.id, id);
      setFavorites(prev => [...prev, id]);
      toast.success('Added to saved properties');
    }
  };

  const toggleType = (type: string) => {
    setDraftSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleAmenity = (amenity: string) => {
    setDraftSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDraftPriceRange([0, 6000]);
    setDraftSelectedTypes([]);
    setDraftSelectedBedrooms('any');
    setDraftSelectedAmenities([]);
    setAppliedFilters({
      priceRange: [0, 6000],
      selectedTypes: [],
      selectedBedrooms: 'any',
      selectedAmenities: [],
    });
  };

  const hasActiveFilters = appliedFilters.priceRange[0] > 0 || appliedFilters.priceRange[1] < 6000 || appliedFilters.selectedTypes.length > 0 || appliedFilters.selectedBedrooms !== 'any' || appliedFilters.selectedAmenities.length > 0;
  
  const hasDraftChanges = 
    draftPriceRange[0] !== appliedFilters.priceRange[0] ||
    draftPriceRange[1] !== appliedFilters.priceRange[1] ||
    JSON.stringify(draftSelectedTypes) !== JSON.stringify(appliedFilters.selectedTypes) ||
    draftSelectedBedrooms !== appliedFilters.selectedBedrooms ||
    JSON.stringify(draftSelectedAmenities) !== JSON.stringify(appliedFilters.selectedAmenities);

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

      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Property Type</Label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map(type => (
            <button 
              key={type.value} 
              onClick={() => toggleType(type.value)} 
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-all',
                draftSelectedTypes.includes(type.value) 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'border-border hover:border-primary hover:bg-primary/5'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
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

      {/* Amenities */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.slice(0, 8).map(amenity => (
            <div 
              key={amenity} 
              onClick={() => toggleAmenity(amenity)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs',
                draftSelectedAmenities.includes(amenity)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Checkbox 
                checked={draftSelectedAmenities.includes(amenity)} 
                onCheckedChange={() => toggleAmenity(amenity)}
                className="h-3.5 w-3.5"
              />
              <span>{amenity}</span>
            </div>
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
              <Input placeholder="Search by city, state, or property name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-12" />
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
                  Showing <span className="font-medium text-foreground">{filteredProperties.length}</span> properties
                </p>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search criteria</p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </div>
              ) : (
                <div className={cn(viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4')}>
                  {filteredProperties.map(property => (
                    <Card key={property.id} className={cn('overflow-hidden card-hover', viewMode === 'list' && 'flex flex-row')}>
                      <Link to={`/properties/${property.id}`} className={cn('block', viewMode === 'list' && 'flex')}>
                        <div className={cn('relative overflow-hidden', viewMode === 'grid' ? 'aspect-[4/3]' : 'w-64 h-48 shrink-0')}>
                          <img src={property.thumbnail} alt={property.title} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                          {property.featured && <span className="absolute top-3 left-3 badge-featured">Featured</span>}
                          {property.isNew && <span className="absolute top-3 left-3 badge-new">New</span>}
                          <button 
                            onClick={e => {
                              e.preventDefault();
                              toggleFavorite(property.id);
                            }} 
                            className={cn('absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-colors', favorites.includes(property.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive')}
                          >
                            <Heart className={cn('h-5 w-5', favorites.includes(property.id) && 'fill-current')} />
                          </button>
                        </div>
                        <CardContent className={cn('p-4', viewMode === 'list' && 'flex-1')}>
                          <div className="flex items-center gap-1 text-warning mb-2">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-medium">{property.rating}</span>
                            <span className="text-xs text-muted-foreground">({property.reviewsCount})</span>
                          </div>
                          <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{property.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            {property.address.city}, {property.address.state}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {property.bedrooms}</span>
                            <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {property.bathrooms}</span>
                            <span className="flex items-center gap-1"><Square className="h-4 w-4" /> {property.size} sqft</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">${property.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
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
