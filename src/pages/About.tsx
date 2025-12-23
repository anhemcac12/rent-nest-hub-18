import { Link } from 'react-router-dom';
import { Users, Building, Award, Heart, Target, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const stats = [
  { value: '2019', label: 'Founded' },
  { value: '50+', label: 'Team Members' },
  { value: '10M+', label: 'Users Served' },
  { value: '15', label: 'Cities' },
];

const values = [
  { icon: Heart, title: 'Trust & Transparency', description: 'We believe in honest communication and verified listings to build lasting relationships.' },
  { icon: Users, title: 'Community First', description: 'Our platform is built around creating meaningful connections between tenants and landlords.' },
  { icon: Award, title: 'Quality Assurance', description: 'Every property is verified to ensure our users get exactly what they expect.' },
  { icon: Target, title: 'Innovation', description: 'We continuously improve our platform to make renting simpler and more efficient.' },
];

const team = [
  { name: 'Sarah Mitchell', role: 'CEO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
  { name: 'Michael Chen', role: 'CTO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
  { name: 'Emily Rodriguez', role: 'Head of Operations', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300' },
  { name: 'James Wilson', role: 'Head of Product', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300' },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom text-center">
            <h1 className="text-display-md font-bold text-foreground mb-6">About RentMate</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to make finding and renting homes easier, faster, and more trustworthy for everyone.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-b border-border">
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

        {/* Story */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-display-sm font-bold text-foreground mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    RentMate was born out of frustration. Our founders, Sarah and Michael, spent months searching for apartments in San Francisco, dealing with unresponsive landlords, misleading listings, and complicated application processes.
                  </p>
                  <p>
                    They knew there had to be a better way. In 2019, they launched RentMate with a simple vision: create a platform where renters could find verified properties and landlords could connect with quality tenants—all in one seamless experience.
                  </p>
                  <p>
                    Today, RentMate has helped millions of people find their perfect home and enabled thousands of landlords to manage their properties more efficiently. But we're just getting started.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600" 
                  alt="Team collaboration"
                  className="rounded-2xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Our Mission</h3>
                </div>
                <p className="text-muted-foreground">
                  To simplify the rental experience by connecting quality tenants with verified properties, making the process transparent, efficient, and stress-free for everyone involved.
                </p>
              </Card>
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <Eye className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Our Vision</h3>
                </div>
                <p className="text-muted-foreground">
                  To become the most trusted rental platform globally, where finding a home feels as natural as finding a friend—built on trust, transparency, and technology.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-display-sm font-bold text-foreground mb-4">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These principles guide every decision we make and every feature we build.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center p-6 card-hover">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-display-sm font-bold text-foreground mb-4">Meet Our Team</h2>
              <p className="text-muted-foreground">The people behind RentMate</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <Card key={index} className="overflow-hidden card-hover">
                  <div className="aspect-square overflow-hidden">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-primary text-primary-foreground">
          <div className="container-custom text-center">
            <h2 className="text-display-sm font-bold mb-4">Join Our Journey</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Whether you're looking for your next home or want to list your property, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/properties">Browse Properties <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
