import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
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

export function PropertyFormModal({ open, onClose, propertyId, onSave }: PropertyFormModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [property, setProperty] = useState<PropertyResponseDTO | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    rentAmount: '',
    securityDeposit: '',
    roomAmount: '',
    specs: {} as Record<string, unknown>,
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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
          roomAmount: String(data.bedrooms + 1), // Total rooms approximation
          specs: {},
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
    setFormData({
      title: '',
      description: '',
      address: '',
      rentAmount: '',
      securityDeposit: '',
      roomAmount: '',
      specs: {},
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
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
          roomAmount: parseInt(formData.roomAmount) || undefined,
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
          roomAmount: parseInt(formData.roomAmount) || 1,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, San Francisco, CA 94102"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rentAmount">Monthly Rent ($) *</Label>
                    <Input
                      id="rentAmount"
                      type="number"
                      value={formData.rentAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="securityDeposit">Security Deposit ($)</Label>
                    <Input
                      id="securityDeposit"
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomAmount">Number of Rooms</Label>
                    <Input
                      id="roomAmount"
                      type="number"
                      value={formData.roomAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomAmount: e.target.value }))}
                      placeholder="3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="font-semibold">Property Images</h3>
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
