import { SystemToggle } from "@/components/SystemToggle";
import { CourtCard } from "@/components/CourtCard";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import { Activity, Clock, Sparkles, TrendingUp, Radio, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { isActive, toggleSystem, courts, stats } = useSystem();
  const { profile, signOut } = useAuth();

  const availableCourts = courts.filter(c => c.isAvailable);

  const formatLastScan = (date: Date | null) => {
    if (!date) return 'Never';

    // Calculate time difference
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;

    // For older times, show actual time
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-600 rounded-xl blur opacity-40" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">CourtWatch</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Welcome Banner */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Radio className={isActive ? 'w-3 h-3 text-emerald-500 animate-pulse' : 'w-3 h-3 text-zinc-500'} />
            <span className="text-sm text-muted-foreground">
              {isActive ? 'Live monitoring' : 'Paused'} · Scans every 5 minutes
            </span>
          </div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight">
            Welcome back, {profile?.name || 'there'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {availableCourts.length > 0
              ? `Found ${availableCourts.length} available ${availableCourts.length === 1 ? 'court' : 'courts'} for you`
              : 'No courts available right now — we\'ll notify you when slots open up'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalScans}</p>
                <p className="text-xs text-muted-foreground">Total scans</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-900/20 to-zinc-900/30 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableCourts.length}</p>
                <p className="text-xs text-muted-foreground">Available now</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-orange-900/20 to-zinc-900/30 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.notificationsSent}</p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 backdrop-blur-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Monitoring System</h3>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Currently scanning for available courts' : 'Monitoring is paused'}
              </p>
              {stats.lastScan && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Last scan: {formatLastScan(stats.lastScan)}</span>
                </div>
              )}
            </div>
            <SystemToggle isActive={isActive} onToggle={toggleSystem} />
          </div>
        </div>

        {/* Available Courts */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-semibold">Available Courts</h3>
            {availableCourts.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {availableCourts.length} of {courts.length} slots
              </span>
            )}
          </div>

          {availableCourts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/20 p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-4 flex items-center justify-center">
                <Activity className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="font-semibold mb-1">No courts available</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                All courts are currently booked. Keep monitoring on and we'll notify you as soon as a slot opens up.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableCourts.map((court, index) => (
                <CourtCard
                  key={court.id}
                  court={court}
                  animationDelay={index * 50}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
