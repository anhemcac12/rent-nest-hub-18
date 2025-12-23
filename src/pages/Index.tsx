import { Link } from 'react-router-dom';
import { Search, MapPin, Home, Shield, Clock, Users, Star, ArrowRight, Check, ChevronDown, Building, Key, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { mockProperties, getFeaturedProperties } from '@/data/mockProperties';

const stats = [
  { value: '10,000+', label: 'Active Properties' },
  { value: '50,000+', label: 'Happy Tenants' },
  { value: '5,000+', label: 'Verified Landlords' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const features = [
  { icon: Shield, title: 'Verified Listings', description: 'All properties are verified for authenticity and quality assurance.' },
  { icon: Clock, title: 'Quick Response', description: 'Connect with landlords instantly and get responses within hours.' },
  { icon: Users, title: 'Trusted Community', description: 'Join thousands of satisfied renters and responsible landlords.' },
  { icon: Key, title: 'Secure Payments', description: 'Safe and secure payment processing for worry-free transactions.' },
];

const tenantSteps = [
  { step: 1, title: 'Search Properties', description: 'Browse through thousands of verified listings with detailed filters.' },
  { step: 2, title: 'Schedule Viewings', description: 'Book property tours at your convenience directly through the platform.' },
  { step: 3, title: 'Apply Online', description: 'Submit your application with all required documents in one place.' },
  { step: 4, title: 'Move In', description: 'Sign your lease digitally and get ready for your new home.' },
];

const testimonials = [
  { name: 'Sarah Johnson', role: 'Tenant', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', rating: 5, comment: 'Found my dream apartment in just 2 weeks! The search filters made it so easy to find exactly what I was looking for.' },
  { name: 'Michael Chen', role: 'Landlord', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', rating: 5, comment: 'Managing my properties has never been easier. The dashboard gives me everything I need at a glance.' },
  { name: 'Emily Rodriguez', role: 'Tenant', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', rating: 5, comment: 'The verification process gave me peace of mind. I knew I was dealing with legitimate listings.' },
];

const faqs = [
  { question: 'How do I create an account?', answer: 'Simply click the "Sign Up" button and choose whether you\'re a tenant or landlord. Fill in your details, verify your email, and you\'re ready to go!' },
  { question: 'Are all listings verified?', answer: 'Yes! Our team verifies all property listings to ensure authenticity. Verified properties display a special badge for easy identification.' },
  { question: 'How do I schedule a property viewing?', answer: 'Once you find a property you like, click the "Schedule Viewing" button on the property page. Select your preferred date and time, and the landlord will confirm.' },
  { question: 'Is my payment information secure?', answer: 'Absolutely. We use bank-level encryption and never store your full payment details. All transactions are processed through secure, PCI-compliant systems.' },
  { question: 'What if I have issues with my rental?', answer: 'Our support team is available 24/7 to help resolve any issues. You can also use the in-app messaging system to communicate directly with your landlord.' },
];

export default function Index() {
  const featuredProperties = getFeaturedProperties().slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />
          <div className="container-custom relative">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h1 className="text-display-lg font-bold text-foreground mb-6 text-balance">
                Find Your Perfect <span className="gradient-text">Rental Home</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 text-balance">
                Discover thousands of verified properties. Connect with trusted landlords. 
                Move into your dream home faster than ever.
              </p>
              
              {/* Search Bar */}
              <div className="bg-card rounded-2xl shadow-xl p-4 md:p-6 border border-border">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="City, neighborhood, or address" 
                      className="pl-10 h-12"
                    />
                  </div>
                  <div className="flex gap-4">
                    <select className="h-12 px-4 rounded-lg border border-input bg-background text-foreground">
                      <option>Any Type</option>
                      <option>Apartment</option>
                      <option>House</option>
                      <option>Studio</option>
                      <option>Condo</option>
                    </select>
                    <Button size="lg" className="h-12 px-8" asChild>
                      <Link to="/properties">
                        <Search className="mr-2 h-5 w-5" />
                        Search
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                Popular: San Francisco, New York, Austin, Miami, Seattle
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/50">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-display-sm font-bold text-foreground mb-2">Featured Properties</h2>
                <p className="text-muted-foreground">Hand-picked properties for you</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/properties">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProperties.map((property) => (
                <Link key={property.id} to={`/properties/${property.id}`} className="group">
                  <Card className="overflow-hidden card-hover">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={property.thumbnail} 
                        alt={property.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      {property.featured && (
                        <span className="absolute top-3 left-3 badge-featured">Featured</span>
                      )}
                      {property.isNew && (
                        <span className="absolute top-3 right-3 badge-new">New</span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-warning mb-2">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{property.rating}</span>
                        <span className="text-xs text-muted-foreground">({property.reviewsCount})</span>
                      </div>
                      <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{property.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{property.address.city}, {property.address.state}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">${property.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                        <span className="text-xs text-muted-foreground">{property.bedrooms} bed · {property.bathrooms} bath</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why RentMate */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-display-sm font-bold text-foreground mb-4">Why Choose RentMate?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're committed to making your rental experience seamless, secure, and stress-free.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="text-center p-6 card-hover">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-display-sm font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-muted-foreground">Your journey to a new home in 4 simple steps</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {tenantSteps.map((item, index) => (
                <div key={index} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                    {item.step}
                  </div>
                  {index < tenantSteps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-border" />
                  )}
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-display-sm font-bold text-foreground mb-4">What Our Users Say</h2>
              <p className="text-muted-foreground">Trusted by thousands of renters and landlords</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center gap-1 text-warning mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6">"{testimonial.comment}"</p>
                  <div className="flex items-center gap-3">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="font-medium text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding bg-primary text-primary-foreground">
          <div className="container-custom text-center">
            <h2 className="text-display-sm font-bold mb-4">Ready to Find Your New Home?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of happy renters who found their perfect place with RentMate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/properties">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Properties
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/auth?mode=signup&role=landlord">
                  <Building className="mr-2 h-5 w-5" />
                  List Your Property
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-padding">
          <div className="container-custom max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-display-sm font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Got questions? We've got answers.</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
