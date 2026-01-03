import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Share2, Star, MapPin, Bed, Bath, Square, Calendar, Clock, Check, X, MessageSquare, Phone, Shield, Home, FileText, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ApplyLeaseModal } from '@/components/property/ApplyLeaseModal';
import { ContactLandlordModal } from '@/components/property/ContactLandlordModal';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { propertyApi, PropertyResponseDTO, PropertySummaryDTO } from '@/lib/api/propertyApi';
import { savedPropertiesApi } from '@/lib/api/savedPropertiesApi';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [property, setProperty] = useState<PropertyResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [relatedProperties, setRelatedProperties] = useState<PropertySummaryDTO[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Fetch property from API
  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await propertyApi.getProperty(Number(id));
        setProperty(data);
      } catch (error) {
        console.error('Failed to fetch property:', error);
        toast.error('Failed to load property');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Fetch related properties based on type
  useEffect(() => {
    const fetchRelatedProperties = async () => {
      if (!property) return;
      
      setIsLoadingRelated(true);
      try {
        const response = await propertyApi.searchProperties({
          type: property.type,
          size: 5, // Get 5 to have extras in case current property is included
          page: 0
        });
        
        // Filter out current property and limit to 4
        const filtered = response.content
          .filter(p => p.id !== property.id)
          .slice(0, 4);
        
        setRelatedProperties(filtered);
      } catch (error) {
        console.error('Failed to fetch related properties:', error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedProperties();
  }, [property]);

  // Load saved status from API
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (user && property && isAuthenticated) {
        try {
          const { saved } = await savedPropertiesApi.checkSavedStatus(property.id);
          setIsFavorite(saved);
        } catch (error) {
          console.error('Failed to check saved status:', error);
        }
      } else {
        setIsFavorite(false);
      }
    };
    checkSavedStatus();
  }, [user, property, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Property Not Found</h1>
            <Button asChild><Link to="/properties">Browse Properties</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = property.photos?.map(p => p.url) || [property.coverImageUrl || '/placeholder.svg'];
  
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }
    
    try {
      if (isFavorite) {
        await savedPropertiesApi.unsaveProperty(property.id);
        setIsFavorite(false);
        toast.success('Removed from saved properties');
      } else {
        await savedPropertiesApi.saveProperty(property.id);
        setIsFavorite(true);
        toast.success('Added to saved properties');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update saved properties';
      toast.error(message);
    }
  };

  const handleApplyLease = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (hasApplied) {
      toast.info('You have already applied to this property');
      navigate('/dashboard/applications');
      return;
    }
    setShowApplyModal(true);
  };

  const handleContactLandlord = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setShowContactModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-foreground">Properties</Link>
            <span>/</span>
            <span className="text-foreground">{property.title}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
                <img 
                  src={images[currentImageIndex]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={cn('w-2 h-2 rounded-full transition-colors', index === currentImageIndex ? 'bg-primary' : 'bg-background/60')}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  {property.featured && <span className="badge-featured">Featured</span>}
                  {property.verified && <span className="badge-verified flex items-center gap-1"><Shield className="h-3 w-3" /> Verified</span>}
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={cn('p-2 rounded-full bg-background/80 backdrop-blur-sm transition-colors', isFavorite ? 'text-destructive' : 'text-muted-foreground hover:text-destructive')}
                  >
                    <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
                  </button>
                  <button className="p-2 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnails with lazy loading */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn('shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors bg-muted', index === currentImageIndex ? 'border-primary' : 'border-transparent')}
                    >
                      <img 
                        src={img} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-semibold">{property.rating || 0}</span>
                  </div>
                  <span className="text-muted-foreground">({property.reviewsCount || 0} reviews)</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{property.title}</h1>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  {property.address}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Bed, label: 'Bedrooms', value: property.bedrooms === 0 ? 'Studio' : property.bedrooms },
                  { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
                  { icon: Square, label: 'Size', value: `${property.size} sqft` },
                  { icon: Home, label: 'Type', value: property.type },
                ].map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                        <div className="font-semibold text-foreground capitalize">{stat.value}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Check className="h-4 w-4 text-accent" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {property.rules && property.rules.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">House Rules</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {property.rules.map((rule, index) => (
                      <div key={index} className="flex items-start gap-2 text-muted-foreground">
                        <div className="mt-1 p-0.5 rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        {rule}
                      </div>
                    ))}
                    <div className="flex items-start gap-2 text-muted-foreground">
                      {property.petFriendly ? (
                        <><div className="mt-1 p-0.5 rounded-full bg-accent/10"><Check className="h-3 w-3 text-accent" /></div>Pets allowed</>
                      ) : (
                        <><div className="mt-1 p-0.5 rounded-full bg-destructive/10"><X className="h-3 w-3 text-destructive" /></div>No pets</>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Price Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-bold text-primary">${property.rentAmount?.toLocaleString() || property.price?.toLocaleString()}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      {property.availableFrom && (
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Available {property.availableFrom}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {property.minimumLease}mo min</span>
                    </div>
                    <Button 
                      className="w-full mb-3" 
                      size="lg" 
                      onClick={handleApplyLease}
                      disabled={hasApplied}
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      {hasApplied ? 'Already Applied' : 'Apply for Lease'}
                    </Button>
                    <Button variant="outline" className="w-full" size="lg" onClick={handleContactLandlord}>
                      <MessageSquare className="mr-2 h-5 w-5" /> Contact Landlord
                    </Button>
                  </CardContent>
                </Card>

                {/* Landlord Card */}
                {property.landlord && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={property.landlord.avatar || undefined} />
                          <AvatarFallback>{property.landlord.name?.[0] || 'L'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{property.landlord.name}</span>
                            {property.landlord.verified && <Shield className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="text-sm text-muted-foreground">{property.landlord.propertiesCount} properties</div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Response rate</span>
                          <span className="font-medium text-foreground">{property.landlord.responseRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Response time</span>
                          <span className="font-medium text-foreground">{property.landlord.responseTime}</span>
                        </div>
                      </div>
                      {property.landlord.phone && (
                        <Button variant="ghost" className="w-full mt-4 justify-start" size="sm">
                          <Phone className="mr-2 h-4 w-4" /> {property.landlord.phone}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Related Properties */}
          {relatedProperties.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Similar Properties</h2>
                <Link 
                  to={`/properties?city=${encodeURIComponent(property.address?.split(',')[1]?.trim() || '')}&type=${property.type}`}
                  className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProperties.map((relatedProperty) => (
                  <Link 
                    key={relatedProperty.id} 
                    to={`/property/${relatedProperty.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[4/3] relative bg-muted">
                        <img 
                          src={relatedProperty.coverImageUrl || '/placeholder.svg'} 
                          alt={relatedProperty.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {relatedProperty.featured && (
                          <span className="absolute top-2 left-2 badge-featured text-xs">Featured</span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {relatedProperty.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 line-clamp-1">
                          <MapPin className="h-3 w-3" />
                          {relatedProperty.address}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {relatedProperty.bedrooms}</span>
                          <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {relatedProperty.bathrooms}</span>
                          <span className="flex items-center gap-1"><Square className="h-3 w-3" /> {relatedProperty.size} sqft</span>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-lg font-bold text-primary">${relatedProperty.rentAmount?.toLocaleString()}</span>
                          <span className="text-muted-foreground text-sm">/mo</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isLoadingRelated && (
            <div className="mt-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <ApplyLeaseModal 
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        property={{
          id: String(property.id),
          title: property.title,
          price: property.rentAmount || property.price,
          address: {
            street: property.address,
            city: '',
            state: ''
          }
        }}
        onSuccess={() => setHasApplied(true)}
      />
      <ContactLandlordModal 
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        property={{
          id: String(property.id),
          title: property.title,
          landlord: {
            id: String(property.landlord?.id),
            name: property.landlord?.name || 'Landlord',
            avatar: property.landlord?.avatar || '',
            responseRate: property.landlord?.responseRate || 0,
            responseTime: property.landlord?.responseTime || '',
            propertiesCount: property.landlord?.propertiesCount || 0,
            verified: property.landlord?.verified || false
          }
        }}
      />
    </div>
  );
}
