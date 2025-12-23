import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, Users, Building, CreditCard, Shield, MessageSquare, FileText, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const categories = [
  { icon: Home, title: 'Getting Started', description: 'New to RentMate? Start here.', count: 8 },
  { icon: Search, title: 'Searching for Properties', description: 'Tips for finding your perfect home.', count: 12 },
  { icon: Users, title: 'For Tenants', description: 'Application, lease, and tenant guides.', count: 15 },
  { icon: Building, title: 'For Landlords', description: 'Listing, management, and landlord tools.', count: 18 },
  { icon: CreditCard, title: 'Payments & Billing', description: 'Payment methods and billing info.', count: 10 },
  { icon: Shield, title: 'Safety & Security', description: 'Keeping your account secure.', count: 7 },
];

const popularFaqs = [
  { question: 'How do I create an account?', answer: 'Creating an account is easy! Click the "Sign Up" button, choose whether you\'re a tenant or landlord, fill in your details, and verify your email. You\'ll be ready to start in minutes.' },
  { question: 'How do I search for properties?', answer: 'Use our search bar on the homepage or Properties page. You can filter by location, price range, property type, number of bedrooms, amenities, and more to find exactly what you\'re looking for.' },
  { question: 'Are listings verified?', answer: 'Yes! All properties on RentMate go through a verification process. Verified properties display a blue verification badge, ensuring you\'re viewing legitimate listings.' },
  { question: 'How do I schedule a property viewing?', answer: 'On any property page, click the "Schedule Viewing" button. Select your preferred date and time, add any notes for the landlord, and submit. You\'ll receive a confirmation once the landlord approves.' },
  { question: 'How do I apply for a property?', answer: 'Click "Apply Now" on the property listing. Complete the application form with your personal information, employment details, and references. Upload any required documents and submit.' },
  { question: 'What payment methods are accepted?', answer: 'We accept major credit/debit cards, bank transfers, and digital wallets. All payments are processed securely through our encrypted payment system.' },
  { question: 'How do I list my property?', answer: 'Sign up as a landlord, go to your dashboard, and click "Add Property." Fill in the property details, upload photos, set your price, and publish. Your listing will be live after verification.' },
  { question: 'Can I cancel my lease?', answer: 'Lease cancellation terms depend on your specific agreement. Review your lease terms or contact your landlord through the messaging system. Our support team can also help mediate if needed.' },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = popularFaqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="section-padding bg-primary text-primary-foreground">
          <div className="container-custom text-center">
            <h1 className="text-display-md font-bold mb-6">How can we help you?</h1>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-background text-foreground"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="section-padding">
          <div className="container-custom">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Browse by Category</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <Card key={index} className="card-hover cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                        <span className="text-xs text-primary">{category.count} articles</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular FAQs */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try a different search term or browse our categories above.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="section-padding">
          <div className="container-custom">
            <Card className="p-8 md:p-12 text-center bg-muted/50">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">Still need help?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Can't find what you're looking for? Our support team is here to help you 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
                <Button size="lg" variant="outline">
                  <FileText className="mr-2 h-5 w-5" /> View Documentation
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
