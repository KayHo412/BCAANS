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
        "group rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 backdrop-blur-sm p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 opacity-0 animate-slide-up",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-500">Available Now</span>
          </div>
          <h3 className="font-semibold text-xl mb-1">
            {court.name}
          </h3>
          {court.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{court.location}</span>
            </div>
          )}
        </div>

        <CheckCircle className="w-5 h-5 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
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
