import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Application } from '@/types/tenant';
import { LeaseDocument } from '@/types/landlord';
import { toast } from '@/hooks/use-toast';

interface CreateLeaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onSubmit: (leaseData: {
    monthlyRent: number;
    securityDeposit: number;
    startDate: string;
    endDate: string;
    documents: LeaseDocument[];
  }) => void;
}

export function CreateLeaseModal({
  open,
  onOpenChange,
  application,
  onSubmit,
}: CreateLeaseModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [monthlyRent, setMonthlyRent] = useState(application.property.price.toString());
  const [securityDeposit, setSecurityDeposit] = useState((application.property.price * 2).toString());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + application.property.minimumLease);
    return date;
  });
  const [documents, setDocuments] = useState<LeaseDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      
      if (!isPdf && !isImage) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload PDF or image files only',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newDoc: LeaseDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: isPdf ? 'pdf' : 'image',
          url: e.target?.result as string,
          uploadedAt: new Date().toISOString(),
        };
        setDocuments((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = () => {
    if (!monthlyRent || !securityDeposit || !startDate || !endDate) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: 'Invalid dates',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    onSubmit({
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: parseFloat(securityDeposit),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      documents,
    });

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Lease Agreement</DialogTitle>
          <DialogDescription>
            Set the lease terms for {application.property.title}. The tenant will review and accept before payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Property Summary */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <img
              src={application.property.thumbnail}
              alt={application.property.title}
              className="h-14 w-14 rounded-lg object-cover"
            />
            <div>
              <h4 className="font-semibold">{application.property.title}</h4>
              <p className="text-sm text-muted-foreground">
                {application.property.address.city}, {application.property.address.state}
              </p>
            </div>
          </div>

          {/* Financial Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="securityDeposit">Security Deposit ($)</Label>
              <Input
                id="securityDeposit"
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                min={0}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date < startDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Payment Due from Tenant</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Security Deposit</span>
                <span>${parseFloat(securityDeposit || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>First Month Rent</span>
                <span>${parseFloat(monthlyRent || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 mt-1">
                <span>Total Due</span>
                <span>
                  ${(parseFloat(securityDeposit || '0') + parseFloat(monthlyRent || '0')).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-3">
            <Label>Lease Documents (PDF or Images)</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload lease agreement documents
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG supported
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {doc.type === 'pdf' ? (
                        <FileText className="h-5 w-5 text-red-500" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="text-sm truncate max-w-[200px]">{doc.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Send to Tenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
