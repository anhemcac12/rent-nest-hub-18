import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-accent' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div
            className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center',
              iconClassName || 'bg-primary/10'
            )}
          >
            <Icon className={cn('h-6 w-6', iconClassName ? 'text-current' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
