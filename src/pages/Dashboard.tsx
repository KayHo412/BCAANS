import { Navigation } from "@/components/Navigation";
import { SystemStatusIndicator } from "@/components/SystemStatusIndicator";
import { SystemToggle } from "@/components/SystemToggle";
import { StatsCard } from "@/components/StatsCard";
import { CourtCard } from "@/components/CourtCard";
import { NotificationLog } from "@/components/NotificationLog";
import { ActivityLog } from "@/components/ActivityLog";
import { useSystem } from "@/context/SystemContext";
import { Search, Bell, Activity, Clock, CheckCircle, Radio } from "lucide-react";

const Dashboard = () => {
  const { isActive, toggleSystem, courts, notifications, activities, stats } = useSystem();

  const availableCourts = courts.filter(c => c.isAvailable);
  
  const formatLastScan = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-8 md:p-12 relative overflow-hidden">
            {/* Background gradient decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Radio className={`w-4 h-4 ${isActive ? 'text-court-available animate-pulse' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-court-available' : 'text-muted-foreground'}`}>
                    {isActive ? 'Live Monitoring Active' : 'Monitoring Paused'}
                  </span>
                </div>
                
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                  Court<span className="gradient-text">Watch</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  Automated badminton court availability monitoring. Get notified instantly when your preferred courts become available.
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-court-available" />
                    <span>{availableCourts.length} slots available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Last scan: {formatLastScan(stats.lastScan)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-6">
                <SystemStatusIndicator isActive={isActive} />
                <SystemToggle isActive={isActive} onToggle={toggleSystem} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Scans"
              value={stats.totalScans}
              subtitle="Since session start"
              icon={Search}
              animationDelay={0}
            />
            <StatsCard
              title="Available Slots"
              value={stats.availableCourts}
              subtitle="Current availability"
              icon={CheckCircle}
              trend="up"
              trendValue="+3 today"
              animationDelay={100}
            />
            <StatsCard
              title="Notifications Sent"
              value={stats.notificationsSent}
              subtitle="This session"
              icon={Bell}
              animationDelay={200}
            />
            <StatsCard
              title="System Uptime"
              value={isActive ? 'Active' : 'Paused'}
              subtitle="5 min intervals"
              icon={Activity}
              animationDelay={300}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available Courts */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-xl">Available Courts</h2>
                <span className="text-sm text-muted-foreground">
                  Showing {availableCourts.length} of {courts.length} slots
                </span>
              </div>
              
              {availableCourts.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">No Available Courts</h3>
                  <p className="text-sm text-muted-foreground">
                    All courts are currently booked. We'll notify you when slots open up.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {availableCourts.slice(0, 8).map((court, index) => (
                    <CourtCard 
                      key={court.id} 
                      court={court} 
                      animationDelay={index * 100}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <NotificationLog notifications={notifications} />
              <ActivityLog activities={activities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
