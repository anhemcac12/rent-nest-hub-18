import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, FileText, MessageSquare, Home, CreditCard, Wrench, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/mockDatabase';
import { Notification } from '@/types/tenant';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const typeIcons = {
  application: FileText,
  message: MessageSquare,
  property: Home,
  payment: CreditCard,
  maintenance: Wrench,
  system: Info,
};

const typeColors = {
  application: 'bg-blue-500/10 text-blue-500',
  message: 'bg-green-500/10 text-green-500',
  property: 'bg-purple-500/10 text-purple-500',
  payment: 'bg-yellow-500/10 text-yellow-500',
  maintenance: 'bg-orange-500/10 text-orange-500',
  system: 'bg-muted text-muted-foreground',
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      setNotifications(getNotifications(user.id));
    }
  }, [user]);

  const handleMarkAsRead = (notificationId: string) => {
    if (!user) return;
    markNotificationAsRead(user.id, notificationId);
    setNotifications(getNotifications(user.id));
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    markAllNotificationsAsRead(user.id);
    setNotifications(getNotifications(user.id));
  };

  const handleDelete = (notificationId: string) => {
    if (!user) return;
    deleteNotification(user.id, notificationId);
    setNotifications(getNotifications(user.id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No notifications yet</h3>
            <p className="text-muted-foreground text-center">
              When you receive notifications, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type];
            const colorClass = typeColors[notification.type];

            return (
              <Card
                key={notification.id}
                className={cn(
                  'transition-all hover:shadow-md',
                  !notification.read && 'border-primary/50 bg-primary/5'
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn('rounded-full p-2', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {notification.title}
                          {!notification.read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {notification.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                          >
                            <Link to={notification.link}>View</Link>
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}