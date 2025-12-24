import { useState } from 'react';
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
import { mockPayments } from '@/data/mockTenant';
import { Payment } from '@/types/tenant';
import { toast } from 'sonner';

const statusConfig = {
  paid: { label: 'Paid', icon: CheckCircle2, className: 'bg-accent/10 text-accent' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning' },
  overdue: { label: 'Overdue', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  scheduled: { label: 'Scheduled', icon: Calendar, className: 'bg-info/10 text-info' },
};

const typeLabels = {
  rent: 'Rent',
  deposit: 'Security Deposit',
  fee: 'Fee',
  utility: 'Utility',
};

export default function Payments() {
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const pendingPayment = mockPayments.find((p) => p.status === 'pending');
  const paidPayments = mockPayments.filter((p) => p.status === 'paid');
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const averageMonthly = paidPayments.filter((p) => p.type === 'rent').reduce((sum, p) => sum + p.amount, 0) / Math.max(1, paidPayments.filter((p) => p.type === 'rent').length);

  let filteredPayments = filter === 'all'
    ? mockPayments
    : mockPayments.filter((p) => p.status === filter);

  filteredPayments = [...filteredPayments].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const handlePayNow = () => {
    toast.info('Payment processing would be handled here');
  };

  const handleDownloadReceipt = (payment: Payment) => {
    toast.success(`Downloading receipt for ${format(parseISO(payment.dueDate), 'MMM yyyy')}`);
  };

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
          value={pendingPayment ? `$${pendingPayment.amount.toLocaleString()}` : '$0'}
          subtitle={pendingPayment ? `Due ${format(parseISO(pendingPayment.dueDate), 'MMM d')}` : 'All paid up!'}
          icon={CreditCard}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Total Paid (YTD)"
          value={`$${totalPaid.toLocaleString()}`}
          subtitle={`${paidPayments.length} transactions`}
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

      {/* Pending Payment Alert */}
      {pendingPayment && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Payment Due</p>
                  <p className="text-sm text-muted-foreground">
                    ${pendingPayment.amount.toLocaleString()} • {pendingPayment.propertyTitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <p className="text-sm text-muted-foreground">
                  Due {format(parseISO(pendingPayment.dueDate), 'MMMM d, yyyy')}
                </p>
                <Button onClick={handlePayNow} className="ml-auto sm:ml-0">
                  Pay Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Payment History</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
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
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
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
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(payment.dueDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {payment.propertyTitle}
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
                        {payment.method || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'paid' && (
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
    </div>
  );
}
