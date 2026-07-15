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
  const isAvailable = court.isAvailable;

  return (
    <div
      className={cn(
        "group rounded-2xl border transition-all duration-300 p-5 opacity-0 animate-slide-up",
        isAvailable
          ? "border-white/5 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
          : "border-red-500/10 bg-gradient-to-br from-zinc-900/40 to-zinc-900/20 hover:border-red-500/20",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                isAvailable ? "text-emerald-500" : "text-red-500"
              )}
            >
              {isAvailable ? "Available Now" : "Unavailable"}
            </span>
          </div>
          <h3 className="font-semibold text-xl mb-1">{court.name}</h3>
          {court.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{court.location}</span>
            </div>
          )}
        </div>

        {isAvailable ? (
          <CheckCircle className="w-5 h-5 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{court.timeSlot}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-zinc-700" />
        <span>{court.date}</span>
      </div>
    </div>
  );
};