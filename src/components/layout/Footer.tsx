import { Link } from 'react-router-dom';
import { Home, Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">RentMate</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Find your perfect rental home with RentMate. We connect tenants with quality properties and help landlords manage their rentals effortlessly.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-background transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-background transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-background transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-background transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/properties" className="text-muted-foreground hover:text-background transition-colors">Browse Properties</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-background transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-background transition-colors">Contact</Link></li>
              <li><Link to="/help" className="text-muted-foreground hover:text-background transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="font-semibold mb-4">For Users</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/auth?mode=signup&role=tenant" className="text-muted-foreground hover:text-background transition-colors">Tenant Sign Up</Link></li>
              <li><Link to="/auth?mode=signup&role=landlord" className="text-muted-foreground hover:text-background transition-colors">Landlord Sign Up</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-background transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-background transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Subscribe to our newsletter for the latest listings and tips.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-background/10 border-background/20 text-background placeholder:text-muted-foreground"
              />
              <Button size="icon" className="shrink-0">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RentMate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
