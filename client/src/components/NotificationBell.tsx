
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { api, type Notification } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";

interface NotificationBellProps {
  language?: Language;
}

export default function NotificationBell({ language = 'en' }: NotificationBellProps) {
  const { toast } = useToast();
  const t = useTranslation(language);
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: () => api.notifications.getAll(),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const unreadCount = notifications.filter(n => n.isRead === 'false' || n.isRead === false).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => api.notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: "Notification deleted" });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation_approved':
        return '✅';
      case 'reservation_rejected':
        return '❌';
      case 'reservation_request':
        return '📋';
      case 'item_damaged':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse text-red-500' : ''}`} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{t('notifications')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              {t('markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('noNotifications')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    notification.isRead === 'false' || notification.isRead === false ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.createdAt), 'PPp')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(notification.isRead === 'false' || notification.isRead === false) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
