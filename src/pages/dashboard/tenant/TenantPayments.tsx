import { useState, useCallback, useMemo } from 'react';
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
  CalendarDays,
  CircleDollarSign,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useRealtimeRefresh } from '@/contexts/RealtimeContext';
import { leaseApi, LeaseResponseDTO } from '@/lib/api/leaseApi';
import { 
  paymentApi, 
  PaymentResponseDTO, 
  PaymentStatus, 
  PaymentType,
  RentScheduleDTO,
  RentScheduleItemDTO,
  RentStatus
} from '@/lib/api/paymentApi';
import { toast } from 'sonner';
import { RentPaymentModal } from '@/components/tenant/RentPaymentModal';
import { Progress } from '@/components/ui/progress';
import { downloadReceipt } from '@/lib/utils/receiptGenerator';

const paymentStatusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  COMPLETED: { label: 'Paid', icon: CheckCircle2, className: 'bg-accent/10 text-accent' },
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning' },
  OVERDUE: { label: 'Overdue', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  REFUNDED: { label: 'Refunded', icon: RefreshCw, className: 'bg-muted text-muted-foreground' },
};

const rentStatusConfig: Record<RentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  PAID: { label: 'Paid', icon: CheckCircle2, className: 'bg-accent/10 text-accent' },
  DUE: { label: 'Due', icon: Clock, className: 'bg-warning/10 text-warning' },
  UPCOMING: { label: 'Upcoming', icon: Calendar, className: 'bg-muted text-muted-foreground' },
  PARTIAL: { label: 'Partial', icon: TrendingUp, className: 'bg-info/10 text-info' },
  OVERDUE: { label: 'Overdue', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  WAIVED: { label: 'Waived', icon: CheckCircle2, className: 'bg-primary/10 text-primary' },
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
  const [selectedRentItem, setSelectedRentItem] = useState<{ lease: any; rentItem: RentScheduleItemDTO } | null>(null);

  // Fetch all tenant leases
  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['tenant-leases'],
    queryFn: leaseApi.getMyLeases,
  });

  // Get active leases for payment
  const activeLeases = leases.filter(l => l.status === 'ACTIVE');

  // Fetch rent schedules for all active leases
  const { data: rentSchedules = [], isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['tenant-rent-schedules', activeLeases.map(l => l.id)],
    queryFn: async () => {
      if (activeLeases.length === 0) return [];
      const schedulePromises = activeLeases.map(lease => 
        paymentApi.getRentSchedule(lease.id).catch(() => null)
      );
      const results = await Promise.all(schedulePromises);
      return results.filter((r): r is RentScheduleDTO => r !== null);
    },
    enabled: activeLeases.length > 0,
  });

  // Fetch payment history for all active leases
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

  // Calculate stats from rent schedules
  const totalStats = rentSchedules.reduce((acc, schedule) => {
    acc.totalMonths += schedule.totalMonths;
    acc.paidMonths += schedule.paidMonths;
    acc.upcomingMonths += schedule.upcomingMonths;
    acc.overdueMonths += schedule.overdueMonths;
    return acc;
  }, { totalMonths: 0, paidMonths: 0, upcomingMonths: 0, overdueMonths: 0 });

  // Get current/overdue rent items
  const currentDueItems = rentSchedules.flatMap(schedule => 
    schedule.schedule.filter(item => item.status === 'DUE' || item.status === 'OVERDUE')
  );

  const overdueAmount = currentDueItems
    .filter(item => item.status === 'OVERDUE')
    .reduce((sum, item) => sum + (item.amountDue - item.amountPaid), 0);

  const dueAmount = currentDueItems.reduce((sum, item) => sum + (item.amountDue - item.amountPaid), 0);

  const completedPayments = allPayments.filter(p => p.status === 'COMPLETED');
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Filter and sort payments
  let filteredPayments = filter === 'all'
    ? allPayments
    : allPayments.filter(p => p.status === filter);

  filteredPayments = [...filteredPayments].sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.dueDate || 0).getTime();
    const dateB = new Date(b.paymentDate || b.dueDate || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handlePayRent = (lease: any, rentItem: RentScheduleItemDTO) => {
    setSelectedRentItem({ lease, rentItem });
    setPaymentModalOpen(true);
  };

  const handleDownloadReceipt = (payment: PaymentResponseDTO) => {
    // Find the lease to get property details
    const lease = activeLeases.find(l => l.id === payment.leaseId);
    
    downloadReceipt({
      payment,
      propertyTitle: lease?.propertyTitle,
      propertyAddress: lease?.propertyAddress,
      landlordName: lease?.landlordName,
    });
    
    toast.success('Receipt downloaded successfully');
  };

  const handlePaymentSuccess = useCallback(() => {
    refetchSchedules();
    refetchPayments();
    toast.success('Payment completed successfully');
  }, [refetchSchedules, refetchPayments]);

  // Auto-refresh when PAYMENT notifications are received
  useRealtimeRefresh(['PAYMENT'], handlePaymentSuccess);

  const isLoading = leasesLoading || schedulesLoading || paymentsLoading;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Outstanding Balance"
          value={`$${dueAmount.toLocaleString()}`}
          subtitle={overdueAmount > 0 ? `$${overdueAmount.toLocaleString()} overdue` : 'All current!'}
          icon={CircleDollarSign}
          iconClassName={overdueAmount > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}
        />
        <StatsCard
          title="Total Paid (YTD)"
          value={`$${totalPaid.toLocaleString()}`}
          subtitle={`${completedPayments.length} transactions`}
          icon={CheckCircle2}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Paid Periods"
          value={`${totalStats.paidMonths}/${totalStats.totalMonths}`}
          subtitle={`${totalStats.upcomingMonths} upcoming`}
          icon={CalendarDays}
          iconClassName="bg-info/10 text-info"
        />
        <StatsCard
          title="Overdue"
          value={totalStats.overdueMonths.toString()}
          subtitle={totalStats.overdueMonths === 0 ? "All caught up!" : "Needs attention"}
          icon={AlertTriangle}
          iconClassName={totalStats.overdueMonths > 0 ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}
        />
      </div>

      {/* Rent Schedule - Current Due */}
      {currentDueItems.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Rent Due
            </CardTitle>
            <CardDescription>These payments need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentDueItems.map((item) => {
              const lease = activeLeases.find(l => 
                rentSchedules.find(s => s.leaseId === l.id)?.schedule.includes(item)
              );
              const config = rentStatusConfig[item.status];
              const StatusIcon = config.icon;
              
              return (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      item.status === 'OVERDUE' ? 'bg-destructive/10' : 'bg-warning/10'
                    }`}>
                      <CreditCard className={`h-6 w-6 ${
                        item.status === 'OVERDUE' ? 'text-destructive' : 'text-warning'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{lease?.propertyTitle || 'Rent Payment'}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(parseISO(item.dueDate), 'MMM d, yyyy')}
                        {item.daysOverdue && item.daysOverdue > 0 && (
                          <span className="text-destructive ml-2">({item.daysOverdue} days overdue)</span>
                        )}
                        {item.daysUntilDue !== null && item.daysUntilDue > 0 && (
                          <span className="text-muted-foreground ml-2">({item.daysUntilDue} days left)</span>
                        )}
                      </p>
                      {item.gracePeriodEnds && (
                        <p className="text-xs text-muted-foreground">
                          Grace period ends: {format(parseISO(item.gracePeriodEnds), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg">${(item.amountDue - item.amountPaid).toLocaleString()}</p>
                      <Badge variant="secondary" className={config.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => lease && handlePayRent(lease, item)}
                      variant={item.status === 'OVERDUE' ? 'destructive' : 'default'}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Rent Schedule Timeline */}
      {rentSchedules.map((schedule) => {
        const lease = activeLeases.find(l => l.id === schedule.leaseId);
        if (!lease) return null;
        
        const progressPercent = (schedule.paidMonths / schedule.totalMonths) * 100;
        
        return (
          <Card key={schedule.leaseId}>
            <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{lease.propertyTitle}</CardTitle>
                  <CardDescription>
                    ${schedule.rentAmount.toLocaleString()}/period (30 days) • {schedule.totalMonths} periods total
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {schedule.paidMonths} of {schedule.totalMonths} paid
                </Badge>
              </div>
              <Progress value={progressPercent} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {schedule.schedule.map((item, index) => {
                  const config = rentStatusConfig[item.status];
                  const StatusIcon = config.icon;
                  const isPayable = item.status === 'DUE' || item.status === 'OVERDUE' || item.status === 'PARTIAL';
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isPayable ? 'hover:border-primary hover:bg-primary/5' : ''
                      } ${config.className.replace('text-', 'border-').split(' ')[0]}/20`}
                      onClick={() => isPayable && handlePayRent(lease, item)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Period {index + 1}
                        </span>
                        <Badge variant="secondary" className={`text-xs ${config.className}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {format(parseISO(item.periodStart), 'MMM d')} - {format(parseISO(item.periodEnd), 'MMM d')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(parseISO(item.dueDate), 'MMM d, yyyy')}
                      </p>
                      {isPayable && (
                        <p className="text-sm font-semibold text-primary mt-1">
                          ${(item.amountDue - item.amountPaid).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

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
                    const config = paymentStatusConfig[payment.status];
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

      {/* Rent Payment Modal */}
      {selectedRentItem && (
        <RentPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          lease={selectedRentItem.lease}
          rentItem={selectedRentItem.rentItem}
          onPaymentComplete={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
