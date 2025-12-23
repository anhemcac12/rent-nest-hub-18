import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

export default function Properties() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 6000]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('any');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredProperties = useMemo(() => {
    let result = [...mockProperties];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.address.city.toLowerCase().includes(query) ||
        p.address.state.toLowerCase().includes(query)
      );
    }

    // Price filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Type filter
    if (selectedTypes.length > 0) {
      result = result.filter(p => selectedTypes.includes(p.type));
    }

    // Bedrooms filter
    if (selectedBedrooms !== 'any') {
      const beds = parseInt(selectedBedrooms);
      result = result.filter(p => beds === 4 ? p.bedrooms >= 4 : p.bedrooms === beds);
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      result = result.filter(p => 
        selectedAmenities.every(a => p.amenities.includes(a))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }

    return result;
  }, [searchQuery, priceRange, selectedTypes, selectedBedrooms, selectedAmenities, sortBy]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange([0, 6000]);
    setSelectedTypes([]);
    setSelectedBedrooms('any');
    setSelectedAmenities([]);
  };

  const hasActiveFilters = searchQuery || priceRange[0] > 0 || priceRange[1] < 6000 || selectedTypes.length > 0 || selectedBedrooms !== 'any' || selectedAmenities.length > 0;

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Price Range</Label>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={6000} step={100} className="mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>${priceRange[0].toLocaleString()}</span>
          <span>${priceRange[1].toLocaleString()}+</span>
        </div>
      </div>

      {/* Property Type */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Property Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleType(type.value)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                selectedTypes.includes(type.value) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Bedrooms</Label>
        <div className="flex gap-2">
          {['any', '0', '1', '2', '3', '4'].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedBedrooms(num)}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                selectedBedrooms === num ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
              )}
            >
              {num === 'any' ? 'Any' : num === '4' ? '4+' : num === '0' ? 'Studio' : num}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {AMENITIES.slice(0, 10).map((amenity) => (
            <div key={amenity} className="flex items-center gap-2">
              <Checkbox 
                id={amenity} 
                checked={selectedAmenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <Label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</Label>
            </div>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" /> Clear All Filters
        </Button>
      )}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                </SelectContent>
              </Select>
              
              <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn('p-3', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn('p-3', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                >
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
                <div className={cn(
                  viewMode === 'grid' 
                    ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'flex flex-col gap-4'
                )}>
                  {filteredProperties.map((property) => (
                    <Card key={property.id} className={cn('overflow-hidden card-hover', viewMode === 'list' && 'flex flex-row')}>
                      <Link to={`/properties/${property.id}`} className={cn('block', viewMode === 'list' && 'flex')}>
                        <div className={cn(
                          'relative overflow-hidden',
                          viewMode === 'grid' ? 'aspect-[4/3]' : 'w-64 h-48 shrink-0'
                        )}>
                          <img 
                            src={property.thumbnail} 
                            alt={property.title}
                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                          />
                          {property.featured && <span className="absolute top-3 left-3 badge-featured">Featured</span>}
                          {property.isNew && <span className="absolute top-3 left-3 badge-new">New</span>}
                          <button
                            onClick={(e) => { e.preventDefault(); toggleFavorite(property.id); }}
                            className={cn(
                              'absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-colors',
                              favorites.includes(property.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                            )}
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
