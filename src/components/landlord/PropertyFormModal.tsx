import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Property, PROPERTY_TYPES, AMENITIES } from '@/types/property';
import { useAuth } from '@/contexts/AuthContext';
import { addLandlordProperty, updateLandlordProperty } from '@/lib/mockDatabase';
import { toast } from '@/hooks/use-toast';

interface PropertyFormModalProps {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
  onSave: () => void;
}

export function PropertyFormModal({ open, onClose, property, onSave }: PropertyFormModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'apartment' as Property['type'],
    price: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    size: '',
    furnished: false,
    petFriendly: false,
    parkingSpaces: '',
    amenities: [] as string[],
    availableFrom: '',
    minimumLease: '12',
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        type: property.type,
        price: property.price.toString(),
        street: property.address.street,
        city: property.address.city,
        state: property.address.state,
        zipCode: property.address.zipCode,
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        size: property.size.toString(),
        furnished: property.furnished,
        petFriendly: property.petFriendly,
        parkingSpaces: property.parkingSpaces.toString(),
        amenities: property.amenities,
        availableFrom: property.availableFrom,
        minimumLease: property.minimumLease.toString(),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'apartment',
        price: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        bedrooms: '',
        bathrooms: '',
        size: '',
        furnished: false,
        petFriendly: false,
        parkingSpaces: '0',
        amenities: [],
        availableFrom: new Date().toISOString().split('T')[0],
        minimumLease: '12',
      });
    }
  }, [property, open]);

  const handleSubmit = () => {
    if (!user) return;

    if (!formData.title || !formData.price || !formData.city) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const propertyData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      price: parseInt(formData.price),
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: 'USA',
      },
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 1,
      size: parseInt(formData.size) || 0,
      furnished: formData.furnished,
      petFriendly: formData.petFriendly,
      parkingSpaces: parseInt(formData.parkingSpaces) || 0,
      amenities: formData.amenities,
      availableFrom: formData.availableFrom,
      minimumLease: parseInt(formData.minimumLease) || 12,
    };

    if (property) {
      updateLandlordProperty(property.id, propertyData);
      toast({
        title: 'Property Updated',
        description: 'Your property has been updated successfully.',
      });
    } else {
      addLandlordProperty(user.id, propertyData);
      toast({
        title: 'Property Added',
        description: 'Your property has been added successfully.',
      });
    }

    onSave();
    onClose();
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>
            {property ? 'Update your property details' : 'Fill in the details for your new rental property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Modern Downtown Apartment"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your property..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Property Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Property['type']) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Rent ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="2000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold">Location</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="123 Main St, Apt 4B"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="San Francisco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Property Details</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size (sqft)</Label>
                <Input
                  id="size"
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="1200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking">Parking</Label>
                <Input
                  id="parking"
                  type="number"
                  value={formData.parkingSpaces}
                  onChange={(e) => setFormData(prev => ({ ...prev, parkingSpaces: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, furnished: !!checked }))}
                />
                <Label htmlFor="furnished" className="cursor-pointer">Furnished</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="petFriendly"
                  checked={formData.petFriendly}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, petFriendly: !!checked }))}
                />
                <Label htmlFor="petFriendly" className="cursor-pointer">Pet Friendly</Label>
              </div>
            </div>
          </div>

          {/* Lease Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold">Lease Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumLease">Minimum Lease (months)</Label>
                <Input
                  id="minimumLease"
                  type="number"
                  value={formData.minimumLease}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumLease: e.target.value }))}
                  placeholder="12"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold">Amenities</h3>
            <div className="grid grid-cols-3 gap-2">
              {AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="cursor-pointer text-sm">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {property ? 'Save Changes' : 'Add Property'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
