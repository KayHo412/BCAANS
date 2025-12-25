import { cn } from "@/lib/utils";
import { Power, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemToggleProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export const SystemToggle = ({ isActive, onToggle, className }: SystemToggleProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Button
        onClick={onToggle}
        size="lg"
        className={cn(
          "w-16 h-16 rounded-full transition-all duration-300",
          isActive 
            ? "bg-destructive hover:bg-destructive/90 button-glow" 
            : "bg-primary hover:bg-primary/90 button-glow"
        )}
      >
        {isActive ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6 ml-1" />
        )}
      </Button>
      
      <div className="text-center">
        <p className={cn(
          "font-display font-semibold text-lg",
          isActive ? "text-court-available" : "text-muted-foreground"
        )}>
          {isActive ? "System Active" : "System Paused"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isActive ? "Monitoring every 5 minutes" : "Click to start monitoring"}
        </p>
      </div>
    </div>
  );
};
