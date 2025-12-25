import { cn } from "@/lib/utils";
import { Activity, Search, Database, AlertCircle, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ActivityEntry {
  id: string;
  type: 'scan' | 'update' | 'error' | 'success';
  message: string;
  timestamp: Date;
  details?: string;
}

interface ActivityLogProps {
  activities: ActivityEntry[];
  className?: string;
}

export const ActivityLog = ({ activities, className }: ActivityLogProps) => {
  const getIcon = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'scan':
        return <Search className="w-4 h-4 text-primary" />;
      case 'update':
        return <Database className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-court-available" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">System Activity</h3>
        </div>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="p-3 font-mono text-xs">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="w-10 h-10 mb-2 opacity-30" />
              <p>No activity recorded</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded hover:bg-secondary/50 transition-colors opacity-0 animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="text-muted-foreground flex-shrink-0">
                    [{formatTime(activity.timestamp)}]
                  </span>
                  <span className="flex-shrink-0">{getIcon(activity.type)}</span>
                  <div className="flex-1">
                    <span className={cn(
                      activity.type === 'error' && "text-destructive",
                      activity.type === 'success' && "text-court-available",
                      activity.type === 'scan' && "text-foreground",
                      activity.type === 'update' && "text-warning"
                    )}>
                      {activity.message}
                    </span>
                    {activity.details && (
                      <p className="text-muted-foreground mt-0.5">{activity.details}</p>
                    )}
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
