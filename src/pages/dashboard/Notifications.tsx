import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, FileText, MessageSquare, Home, CreditCard, Wrench, Info, ScrollText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { notificationsApi, Notification, NotificationType } from '@/lib/api/notificationsApi';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { getRoleAwareNotificationLink } from '@/lib/utils/notificationLinks';

const typeIcons: Record<NotificationType, React.ElementType> = {
  APPLICATION: FileText,
  MESSAGE: MessageSquare,
  PROPERTY: Home,
  PAYMENT: CreditCard,
  MAINTENANCE: Wrench,
  LEASE: ScrollText,
  SYSTEM: Info,
};

const typeColors: Record<NotificationType, string> = {
  APPLICATION: 'bg-blue-500/10 text-blue-500',
  MESSAGE: 'bg-green-500/10 text-green-500',
  PROPERTY: 'bg-purple-500/10 text-purple-500',
  PAYMENT: 'bg-yellow-500/10 text-yellow-500',
  MAINTENANCE: 'bg-orange-500/10 text-orange-500',
  LEASE: 'bg-indigo-500/10 text-indigo-500',
  SYSTEM: 'bg-muted text-muted-foreground',
};

export default function Notifications() {
  const { user } = useAuth();
  const { notifications: realtimeNotifications, refreshNotifications: refreshGlobal, subscribeToRefresh } = useRealtime();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const fetchNotifications = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications({ page: pageNum, size: 20 });
      if (pageNum === 0) {
        setNotifications(response.content);
      } else {
        setNotifications(prev => [...prev, ...response.content]);
      }
      setTotalElements(response.totalElements);
      setHasMore(pageNum < response.totalPages - 1);
      setPage(pageNum);
      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to ALL notification types for real-time updates
  useEffect(() => {
    const allTypes: NotificationType[] = ['APPLICATION', 'LEASE', 'PAYMENT', 'MAINTENANCE', 'MESSAGE', 'PROPERTY', 'SYSTEM'];
    
    const handleNewNotification = () => {
      // Debounce - don't refetch if we just fetched
      if (Date.now() - lastFetchRef.current > 1000) {
        console.log('[Notifications] Real-time update triggered, refetching...');
        fetchNotifications(0);
      }
    };

    const unsubscribe = subscribeToRefresh(allTypes, handleNewNotification);
    return unsubscribe;
  }, [subscribeToRefresh, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      refreshGlobal();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      refreshGlobal();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const response = await notificationsApi.deleteAllRead();
      setNotifications(prev => prev.filter(n => !n.read));
      toast.success(`Deleted ${response.count} read notifications`);
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
      toast.error('Failed to delete read notifications');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {readCount > 0 && (
            <Button variant="outline" onClick={handleDeleteAllRead}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete read
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
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
            const Icon = typeIcons[notification.type] || Info;
            const colorClass = typeColors[notification.type] || typeColors.SYSTEM;

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
                        {notification.link && user?.role && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                          >
                            <Link to={getRoleAwareNotificationLink(notification.link, notification.type, user.role)}>View</Link>
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

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => fetchNotifications(page + 1)}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
