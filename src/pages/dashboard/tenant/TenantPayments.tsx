import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { leaseApi } from '@/lib/api/leaseApi';
import { paymentApi, PaymentResponseDTO, PaymentStatus, PaymentType } from '@/lib/api/paymentApi';
import { toast } from 'sonner';
import { LeasePaymentModal } from '@/components/tenant/LeasePaymentModal';

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  COMPLETED: { label: 'Paid', icon: CheckCircle2, className: 'bg-accent/10 text-accent' },
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning' },
  OVERDUE: { label: 'Overdue', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  REFUNDED: { label: 'Refunded', icon: RefreshCw, className: 'bg-muted text-muted-foreground' },
};

const typeLabels: Record<PaymentType, string> = {
  RENT: 'Rent',
  DEPOSIT: 'Security Deposit',
  DEPOSIT_AND_FIRST_RENT: 'Deposit + First Rent',
  LATE_FEE: 'Late Fee',
  MAINTENANCE_FEE: 'Maintenance Fee',
  OTHER: 'Other',
};

export default function Payments() {
  const [filter, setFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<any>(null);

  // Fetch all tenant leases
  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['tenant-leases'],
    queryFn: leaseApi.getMyLeases,
  });

  // Get active leases for payment
  const activeLeases = leases.filter(l => l.status === 'ACTIVE');

  // Fetch payments for all active leases
  const { data: allPayments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['tenant-payments', activeLeases.map(l => l.id)],
    queryFn: async () => {
      if (activeLeases.length === 0) return [];
      const paymentPromises = activeLeases.map(lease => 
        paymentApi.getPaymentsForLease(lease.id).catch(() => [])
      );
      const results = await Promise.all(paymentPromises);
      return results.flat();
    },
    enabled: activeLeases.length > 0,
  });

  // Calculate stats
  const pendingPayments = allPayments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE');
  const completedPayments = allPayments.filter(p => p.status === 'COMPLETED');
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const rentPayments = completedPayments.filter(p => p.type === 'RENT');
  const averageMonthly = rentPayments.length > 0 
    ? rentPayments.reduce((sum, p) => sum + p.amount, 0) / rentPayments.length 
    : 0;

  // Filter and sort payments
  let filteredPayments = filter === 'all'
    ? allPayments
    : allPayments.filter(p => p.status === filter);

  filteredPayments = [...filteredPayments].sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.dueDate || 0).getTime();
    const dateB = new Date(b.paymentDate || b.dueDate || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handlePayNow = (lease: any) => {
    setSelectedLease(lease);
    setPaymentModalOpen(true);
  };

  const handleDownloadReceipt = (payment: PaymentResponseDTO) => {
    toast.success(`Downloading receipt for payment #${payment.id}`);
  };

  const handlePaymentSuccess = () => {
    refetchPayments();
    toast.success('Payment completed successfully');
  };

  const isLoading = leasesLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Manage your rent payments and view history
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Outstanding Balance"
          value={`$${totalPending.toLocaleString()}`}
          subtitle={pendingPayments.length > 0 ? `${pendingPayments.length} pending payment(s)` : 'All paid up!'}
          icon={CreditCard}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Total Paid (YTD)"
          value={`$${totalPaid.toLocaleString()}`}
          subtitle={`${completedPayments.length} transactions`}
          icon={CheckCircle2}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Average Monthly"
          value={`$${averageMonthly.toLocaleString()}`}
          subtitle="Based on rent payments"
          icon={Calendar}
          iconClassName="bg-info/10 text-info"
        />
      </div>

      {/* Active Leases - Quick Pay */}
      {activeLeases.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Quick Pay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeLeases.map(lease => (
              <div key={lease.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{lease.propertyTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Rent: ${lease.rentAmount.toLocaleString()}/month
                    </p>
                  </div>
                </div>
                <Button onClick={() => handlePayNow(lease)}>
                  Make Payment
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Active Leases */}
      {activeLeases.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Active Leases</h3>
            <p className="text-muted-foreground">
              You don't have any active leases to make payments for.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Payment History</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="COMPLETED">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-36">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment records found
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const config = statusConfig[payment.status];
                    const StatusIcon = config.icon;
                    const displayDate = payment.paymentDate || payment.dueDate;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {displayDate ? format(parseISO(displayDate), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>{typeLabels[payment.type]}</TableCell>
                        <TableCell className="font-semibold">
                          ${payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={config.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.paymentMethod || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.status === 'COMPLETED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReceipt(payment)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <Badge>Default</Badge>
          </div>
          <Button variant="outline" className="mt-4">
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedLease && (
        <LeasePaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          lease={selectedLease}
          onPaymentComplete={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
