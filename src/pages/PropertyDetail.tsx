import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Share2, Star, MapPin, Bed, Bath, Square, Calendar, Clock, Check, X, MessageSquare, Phone, Shield, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ApplyLeaseModal } from '@/components/property/ApplyLeaseModal';
import { ContactLandlordModal } from '@/components/property/ContactLandlordModal';
import { getPropertyById, getReviewsByPropertyId, mockProperties } from '@/data/mockProperties';
import { useAuth } from '@/contexts/AuthContext';
import { isPropertySaved, saveProperty, unsaveProperty, hasAppliedToProperty } from '@/lib/mockDatabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const property = getPropertyById(id || '');
  const reviews = getReviewsByPropertyId(id || '');
  const similarProperties = mockProperties.filter(p => p.id !== id && p.type === property?.type).slice(0, 4);

  // Load saved/applied status when user changes
  useEffect(() => {
    if (user && property) {
      setIsFavorite(isPropertySaved(user.id, property.id));
      setHasApplied(hasAppliedToProperty(user.id, property.id));
    } else {
      setIsFavorite(false);
      setHasApplied(false);
    }
  }, [user, property]);

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

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);

  const handleToggleFavorite = () => {
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }
    
    if (isFavorite) {
      unsaveProperty(user.id, property.id);
      setIsFavorite(false);
      toast.success('Removed from saved properties');
    } else {
      saveProperty(user.id, property.id);
      setIsFavorite(true);
      toast.success('Added to saved properties');
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
                  src={property.images[currentImageIndex]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn('w-2 h-2 rounded-full transition-colors', index === currentImageIndex ? 'bg-primary' : 'bg-background/60')}
                    />
                  ))}
                </div>
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

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {property.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn('shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors', index === currentImageIndex ? 'border-primary' : 'border-transparent')}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Title & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-semibold">{property.rating}</span>
                  </div>
                  <span className="text-muted-foreground">({property.reviewsCount} reviews)</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{property.title}</h1>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  {property.address.street}, {property.address.city}, {property.address.state} {property.address.zipCode}
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

              {/* Rules */}
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

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.userAvatar} />
                              <AvatarFallback>{review.userName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-medium text-foreground">{review.userName}</div>
                                  <div className="text-xs text-muted-foreground">{review.createdAt}</div>
                                </div>
                                <div className="flex items-center gap-1 text-warning">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-current" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-muted-foreground">{review.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                      <span className="text-3xl font-bold text-primary">${property.price.toLocaleString()}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Available {property.availableFrom}</span>
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
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={property.landlord.avatar} />
                        <AvatarFallback>{property.landlord.name[0]}</AvatarFallback>
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
              </div>
            </div>
          </div>

          {/* Similar Properties */}
          {similarProperties.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">Similar Properties</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProperties.map((p) => (
                  <Link key={p.id} to={`/properties/${p.id}`} className="group">
                    <Card className="overflow-hidden card-hover">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={p.thumbnail} alt={p.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{p.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{p.address.city}, {p.address.state}</p>
                        <span className="text-lg font-bold text-primary">${p.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <ApplyLeaseModal
        open={showApplyModal}
        onOpenChange={setShowApplyModal}
        property={property}
      />
      <ContactLandlordModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
        property={property}
      />
    </div>
  );
}
