import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  CreditCard,
  MessageSquare,
  Wrench,
  FileText,
  FolderOpen,
} from 'lucide-react';
import { ActivityItem } from '@/types/tenant';
import { cn } from '@/lib/utils';

const iconMap = {
  payment: CreditCard,
  message: MessageSquare,
  maintenance: Wrench,
  application: FileText,
  document: FolderOpen,
};

const colorMap = {
  payment: 'bg-accent/10 text-accent',
  message: 'bg-primary/10 text-primary',
  maintenance: 'bg-warning/10 text-warning',
  application: 'bg-info/10 text-info',
  document: 'bg-muted text-muted-foreground',
};

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 5 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => {
        const Icon = iconMap[activity.type];
        const colorClass = colorMap[activity.type];

        return (
          <Link
            key={activity.id}
            to={activity.link || '#'}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', colorClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {format(parseISO(activity.timestamp), 'MMM d')}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
