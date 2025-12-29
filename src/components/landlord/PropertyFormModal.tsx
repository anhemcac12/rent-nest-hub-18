import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PROPERTY_TYPES, AMENITIES } from '@/types/property';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { propertyApi, PropertyResponseDTO } from '@/lib/api/propertyApi';

interface PropertyFormModalProps {
  open: boolean;
  onClose: () => void;
  propertyId?: number | null;
  onSave: () => void;
}

interface FormData {
  title: string;
  description: string;
  address: string;
  rentAmount: string;
  securityDeposit: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  currency: string;
  furnished: boolean;
  petFriendly: boolean;
  parkingSpaces: string;
  amenities: string[];
  rules: string[];
  availableFrom: string;
  minimumLease: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  address: '',
  rentAmount: '',
  securityDeposit: '',
  type: 'APARTMENT',
  bedrooms: '1',
  bathrooms: '1',
  size: '500',
  currency: 'USD',
  furnished: false,
  petFriendly: false,
  parkingSpaces: '0',
  amenities: [],
  rules: [],
  availableFrom: '',
  minimumLease: '12',
};

export function PropertyFormModal({ open, onClose, propertyId, onSave }: PropertyFormModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [property, setProperty] = useState<PropertyResponseDTO | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');

  // Fetch property data if editing
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setProperty(null);
        resetForm();
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await propertyApi.getProperty(propertyId);
        setProperty(data);
        setFormData({
          title: data.title,
          description: data.description,
          address: data.address,
          rentAmount: String(data.rentAmount),
          securityDeposit: data.securityDeposit ? String(data.securityDeposit) : '',
          type: data.type || 'APARTMENT',
          bedrooms: String(data.bedrooms || 1),
          bathrooms: String(data.bathrooms || 1),
          size: String(data.size || 500),
          currency: data.currency || 'USD',
          furnished: data.furnished || false,
          petFriendly: data.petFriendly || false,
          parkingSpaces: String(data.parkingSpaces || 0),
          amenities: data.amenities || [],
          rules: data.rules || [],
          availableFrom: data.availableFrom || '',
          minimumLease: String(data.minimumLease || 12),
        });
        // Set existing images as previews
        if (data.photos) {
          setPreviewUrls(data.photos.map(p => p.url));
        }
      } catch (error) {
        console.error('Failed to fetch property:', error);
        toast.error('Failed to load property');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchProperty();
    }
  }, [propertyId, open]);

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setNewRule('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!formData.title || !formData.rentAmount || !formData.address) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      if (propertyId) {
        // Update existing property
        await propertyApi.updateProperty(propertyId, {
          title: formData.title,
          description: formData.description,
          address: formData.address,
          rentAmount: parseFloat(formData.rentAmount),
          securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
          type: formData.type as 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM' | 'CONDO' | 'TOWNHOUSE',
          bedrooms: parseInt(formData.bedrooms) || 1,
          bathrooms: parseInt(formData.bathrooms) || 1,
          size: parseInt(formData.size) || 500,
          currency: formData.currency,
          furnished: formData.furnished,
          petFriendly: formData.petFriendly,
          parkingSpaces: parseInt(formData.parkingSpaces) || 0,
          amenities: formData.amenities,
          rules: formData.rules,
          availableFrom: formData.availableFrom || undefined,
          minimumLease: parseInt(formData.minimumLease) || 12,
          photos_to_add: selectedFiles.length > 0 ? selectedFiles : undefined,
        });
        toast.success('Property updated successfully');
      } else {
        // Create new property
        await propertyApi.createProperty({
          title: formData.title,
          description: formData.description,
          address: formData.address,
          rentAmount: parseFloat(formData.rentAmount),
          securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
          type: formData.type as 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM' | 'CONDO' | 'TOWNHOUSE',
          bedrooms: parseInt(formData.bedrooms) || 1,
          bathrooms: parseInt(formData.bathrooms) || 1,
          size: parseInt(formData.size) || 500,
          currency: formData.currency,
          furnished: formData.furnished,
          petFriendly: formData.petFriendly,
          parkingSpaces: parseInt(formData.parkingSpaces) || 0,
          amenities: formData.amenities,
          rules: formData.rules,
          availableFrom: formData.availableFrom || undefined,
          minimumLease: parseInt(formData.minimumLease) || 12,
          files: selectedFiles.length > 0 ? selectedFiles : undefined,
        });
        toast.success('Property created successfully');
      }

      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save property:', error);
      toast.error(propertyId ? 'Failed to update property' : 'Failed to create property');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{propertyId ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>
            {propertyId ? 'Update your property details' : 'Fill in the details for your new rental property'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Basic Information</h3>
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
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, San Francisco, CA 94102"
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Property Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value.toUpperCase()}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="1"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sqft)</Label>
                  <Input
                    id="size"
                    type="number"
                    min="0"
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parkingSpaces">Parking Spaces</Label>
                  <Input
                    id="parkingSpaces"
                    type="number"
                    min="0"
                    value={formData.parkingSpaces}
                    onChange={(e) => setFormData(prev => ({ ...prev, parkingSpaces: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="furnished"
                    checked={formData.furnished}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, furnished: checked }))}
                  />
                  <Label htmlFor="furnished">Furnished</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="petFriendly"
                    checked={formData.petFriendly}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, petFriendly: checked }))}
                  />
                  <Label htmlFor="petFriendly">Pet Friendly</Label>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Pricing & Lease</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Monthly Rent *</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">Security Deposit</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                    placeholder="1000"
                  />
                </div>
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
                  <Label htmlFor="minimumLease">Min Lease (months)</Label>
                  <Input
                    id="minimumLease"
                    type="number"
                    min="1"
                    value={formData.minimumLease}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimumLease: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(amenity => (
                  <Badge
                    key={amenity}
                    variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">House Rules</h3>
              <div className="flex gap-2">
                <Input
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Add a house rule..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                />
                <Button type="button" variant="outline" onClick={addRule}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.rules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.rules.map((rule, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {rule}
                      <button onClick={() => removeRule(index)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Property Images</h3>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-dashed"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {previewUrls.length === 0 && (
                  <div className="flex items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mr-2" />
                    <span>No images uploaded yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {propertyId ? 'Update Property' : 'Add Property'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
