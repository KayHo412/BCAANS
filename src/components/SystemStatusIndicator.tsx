import { cn } from "@/lib/utils";

interface SystemStatusIndicatorProps {
  isActive: boolean;
  className?: string;
}

export const SystemStatusIndicator = ({ isActive, className }: SystemStatusIndicatorProps) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer pulse rings */}
      {isActive && (
        <>
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-pulse-ring" />
          <div className="absolute w-20 h-20 rounded-full bg-primary/30 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        </>
      )}
      
      {/* Main indicator */}
      <div 
        className={cn(
          "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
          isActive 
            ? "bg-primary glow-effect animate-pulse-dot" 
            : "bg-muted"
        )}
      >
        {/* Inner core */}
        <div 
          className={cn(
            "w-8 h-8 rounded-full transition-all duration-500",
            isActive ? "bg-primary-foreground" : "bg-muted-foreground/30"
          )}
        />
        
        {/* Radar sweep for active state */}
        {isActive && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div 
              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left animate-radar"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--primary-foreground)) 0%, transparent 100%)'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
