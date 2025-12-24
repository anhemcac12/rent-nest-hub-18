import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaseAgreement } from '@/types/landlord';
import {
  Calendar,
  DollarSign,
  FileText,
  Download,
  User,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Send,
  CreditCard,
} from 'lucide-react';

interface LeaseDetailsModalProps {
  lease: LeaseAgreement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaseDetailsModal({ lease, open, onOpenChange }: LeaseDetailsModalProps) {
  if (!lease) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'pending_tenant':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Tenant Review</Badge>;
      case 'tenant_accepted':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Tenant Accepted</Badge>;
      case 'payment_pending':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Payment Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTimelineEvents = () => {
    const events = [];
    
    // Created
    events.push({
      icon: <FileText className="h-4 w-4" />,
      title: 'Lease Created',
      date: lease.createdAt,
      status: 'completed',
    });

    // Sent to tenant
    if (lease.sentToTenantAt) {
      events.push({
        icon: <Send className="h-4 w-4" />,
        title: 'Sent to Tenant',
        date: lease.sentToTenantAt,
        status: 'completed',
      });
    }

    // Tenant response
    if (lease.tenantRespondedAt) {
      if (lease.status === 'rejected') {
        events.push({
          icon: <XCircle className="h-4 w-4" />,
          title: 'Tenant Rejected',
          date: lease.tenantRespondedAt,
          status: 'rejected',
          description: lease.rejectionReason,
        });
      } else if (lease.status === 'active' || lease.status === 'payment_pending') {
        events.push({
          icon: <CheckCircle2 className="h-4 w-4" />,
          title: 'Tenant Accepted',
          date: lease.tenantRespondedAt,
          status: 'completed',
        });
      }
    }

    // Payment
    if (lease.paidAt) {
      events.push({
        icon: <CreditCard className="h-4 w-4" />,
        title: 'Payment Received',
        date: lease.paidAt,
        status: 'completed',
        description: `$${lease.paymentAmount?.toLocaleString()} received`,
      });
    }

    // Active
    if (lease.status === 'active') {
      events.push({
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: 'Lease Active',
        date: lease.paidAt || lease.updatedAt,
        status: 'completed',
      });
    }

    return events;
  };

  const timelineEvents = getTimelineEvents();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Lease Agreement Details</DialogTitle>
              <DialogDescription className="mt-1">
                {lease.property.title}
              </DialogDescription>
            </div>
            {getStatusBadge(lease.status)}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Property Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img
                    src={lease.property.thumbnail}
                    alt={lease.property.title}
                    className="h-24 w-32 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{lease.property.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {lease.property.address.street}, {lease.property.address.city}, {lease.property.address.state} {lease.property.address.zipCode}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>{lease.property.bedrooms} bed</span>
                      <span>{lease.property.bathrooms} bath</span>
                      <span>{lease.property.size} sqft</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tenant Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={lease.tenantAvatar} />
                    <AvatarFallback>
                      {lease.tenantName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">{lease.tenantName}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {lease.tenantEmail}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lease Terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Lease Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(lease.startDate), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{format(new Date(lease.endDate), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="text-xl font-bold text-primary">${lease.monthlyRent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Security Deposit</p>
                    <p className="text-xl font-bold">${lease.securityDeposit.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status (for active leases) */}
            {lease.paymentStatus && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Initial Payment</p>
                      <p className="font-medium">${lease.paymentAmount?.toLocaleString()}</p>
                    </div>
                    <Badge className={lease.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {lease.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                  {lease.paidAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Paid on {format(new Date(lease.paidAt), 'MMMM d, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {lease.status === 'rejected' && lease.rejectionReason && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{lease.rejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents ({lease.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lease.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents attached</p>
                ) : (
                  <div className="space-y-2">
                    {lease.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className={`
                        flex h-8 w-8 items-center justify-center rounded-full
                        ${event.status === 'completed' ? 'bg-green-100 text-green-600' : ''}
                        ${event.status === 'rejected' ? 'bg-red-100 text-red-600' : ''}
                        ${event.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : ''}
                      `}>
                        {event.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status-specific Actions */}
            <div className="flex gap-3 pt-2">
              {lease.status === 'pending_tenant' && (
                <>
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Cancel Lease
                  </Button>
                </>
              )}
              {lease.status === 'rejected' && (
                <Button className="flex-1">
                  Create New Lease for Property
                </Button>
              )}
              {lease.status === 'active' && (
                <>
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Agreement
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Terminate Lease
                  </Button>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
