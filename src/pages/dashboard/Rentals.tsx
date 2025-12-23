import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Building2,
  Calendar,
  MapPin,
  CreditCard,
  MessageSquare,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { mockRentals } from '@/data/mockTenant';
import { Rental } from '@/types/tenant';

const statusStyles = {
  active: 'bg-accent text-accent-foreground',
  past: 'bg-muted text-muted-foreground',
  upcoming: 'bg-primary text-primary-foreground',
};

function RentalCard({ rental, isActive }: { rental: Rental; isActive: boolean }) {
  return (
    <Card className={isActive ? 'border-primary/50' : ''}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <img
            src={rental.property.thumbnail}
            alt={rental.property.title}
            className="w-full lg:w-64 h-48 object-cover rounded-lg"
          />
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={statusStyles[rental.status]}>
                    {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold">{rental.property.title}</h3>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {rental.property.address.street}, {rental.property.address.city},{' '}
                  {rental.property.address.state}
                </p>
              </div>
              <Link to={`/properties/${rental.propertyId}`}>
                <Button variant="outline" size="sm">
                  View Property
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Monthly Rent</p>
                <p className="font-semibold">${rental.monthlyRent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Security Deposit</p>
                <p className="font-semibold">${rental.securityDeposit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lease Start</p>
                <p className="font-semibold">{format(parseISO(rental.leaseStart), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lease End</p>
                <p className="font-semibold">{format(parseISO(rental.leaseEnd), 'MMM d, yyyy')}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={rental.property.landlord.avatar} />
                  <AvatarFallback>
                    {rental.property.landlord.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{rental.property.landlord.name}</p>
                  <p className="text-xs text-muted-foreground">Landlord</p>
                </div>
              </div>
              {isActive && (
                <div className="flex gap-2">
                  <Link to="/dashboard/payments">
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Pay Rent
                    </Button>
                  </Link>
                  <Link to="/dashboard/maintenance">
                    <Button variant="outline" size="sm">
                      <Wrench className="h-4 w-4 mr-1" />
                      Maintenance
                    </Button>
                  </Link>
                  <Link to="/dashboard/messages">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Rentals() {
  const activeRentals = mockRentals.filter((r) => r.status === 'active');
  const pastRentals = mockRentals.filter((r) => r.status === 'past');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Rentals</h1>
        <p className="text-muted-foreground mt-1">
          Manage your current and past rental agreements
        </p>
      </div>

      {/* Current Rentals */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Current Rental
        </h2>
        {activeRentals.length > 0 ? (
          activeRentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} isActive={true} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Active Rental</h3>
              <p className="text-muted-foreground mb-4">
                You don't have an active rental yet. Browse properties to find your next home!
              </p>
              <Link to="/properties">
                <Button>Browse Properties</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Rentals */}
      {pastRentals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rental History
          </h2>
          {pastRentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} isActive={false} />
          ))}
        </div>
      )}
    </div>
  );
}
