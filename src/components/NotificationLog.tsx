import { cn } from "@/lib/utils";
import { Bell, Mail, Clock, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface NotificationEntry {
  id: string;
  courtName: string;
  timeSlot: string;
  userEmail: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
}

interface NotificationLogProps {
  notifications: NotificationEntry[];
  className?: string;
}

export const NotificationLog = ({ notifications, className }: NotificationLogProps) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Notification Log</h3>
          <span className="ml-auto text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            {notifications.length} entries
          </span>
        </div>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">Notifications will appear here when courts become available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors opacity-0 animate-slide-up",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      notification.status === 'sent' ? "bg-court-available/20" : "bg-warning/20"
                    )}>
                      {notification.status === 'sent' ? (
                        <CheckCircle2 className="w-4 h-4 text-court-available" />
                      ) : (
                        <Mail className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {notification.courtName}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDate(notification.sentAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{notification.timeSlot}</span>
                        <span className="text-border">•</span>
                        <span className="truncate">{notification.userEmail}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-2">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          notification.status === 'sent' 
                            ? "bg-court-available/20 text-court-available"
                            : notification.status === 'pending'
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive"
                        )}>
                          {notification.status === 'sent' ? 'Sent' : notification.status === 'pending' ? 'Pending' : 'Failed'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTime(notification.sentAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
