import { cn } from "@/lib/utils";
import { Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

export interface Court {
  id: string;
  name: string;
  timeSlot: string;
  date: string;
  isAvailable: boolean;
  location?: string;
}

interface CourtCardProps {
  court: Court;
  className?: string;
  animationDelay?: number;
}

export const CourtCard = ({ court, className, animationDelay = 0 }: CourtCardProps) => {
  return (
    <div 
      className={cn(
        "glass-card p-5 transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 opacity-0 animate-slide-up",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">
            {court.name}
          </h3>
          {court.location && (
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{court.location}</span>
            </div>
          )}
        </div>
        
        <div 
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            court.isAvailable 
              ? "bg-court-available/20 text-court-available" 
              : "bg-court-booked/20 text-court-booked"
          )}
        >
          {court.isAvailable ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Available</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>Booked</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>{court.timeSlot}</span>
        </div>
        <div className="text-muted-foreground">
          {court.date}
        </div>
      </div>
      
      {court.isAvailable && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-court-available animate-pulse" />
            <span className="text-xs text-court-available font-medium">
              New availability detected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
