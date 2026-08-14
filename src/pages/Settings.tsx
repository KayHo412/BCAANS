import { useEffect, useState } from "react";
import { PreferencesForm, UserPreferences } from "@/components/PreferencesForm";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import { Settings as SettingsIcon, Info, Activity, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Settings = () => {
  const { profile, updateProfile, signOut } = useAuth();
  const { allCourts, stats } = useSystem();
  const [initialPreferences, setInitialPreferences] = useState<UserPreferences>({
    email: "",
    preferredTimeSlots: [],
    preferredCourts: [],
    notificationsEnabled: true,
    instantNotifications: true,
  });

  // Extract unique court names from all available courts
  const availableCourtNames = Array.from(new Set(allCourts.map((c) => c.name))).sort();

  // Sync profile changes to preferences form
  useEffect(() => {
    if (profile) {
      setInitialPreferences({
        email: profile.email,
        preferredTimeSlots: profile.preferred_time_slots || [],
        preferredCourts: profile.preferred_courts || [],
        notificationsEnabled: profile.notifications_enabled ?? true,
        instantNotifications: true,
      });
    }
  }, [profile]);

  const handleSave = async (prefs: UserPreferences) => {
    await updateProfile({
      email: prefs.email,
      preferred_time_slots: prefs.preferredTimeSlots,
      preferred_courts: prefs.preferredCourts,
      notifications_enabled: prefs.notificationsEnabled,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-600 rounded-xl blur opacity-40" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Configure the preferences stored with your account.
          </p>
        </div>

        {/* Info Banner - Notification System */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 mb-8 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Notification configuration</p>
            <p className="text-muted-foreground">
              The dashboard refreshes court availability every 5 minutes. These preferences filter
              which courts you see in the dashboard. Email notifications are configured separately
              with EMAIL_TO and SMTP settings in .env.
            </p>
          </div>
        </div>

        {/* Error Banner - If last scan failed */}
        {stats.lastError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Monitoring error</p>
              <p className="text-muted-foreground">{stats.lastError}</p>
            </div>
          </div>
        )}

        {/* Preferences Form */}
        <PreferencesForm
          initialPreferences={initialPreferences}
          onSave={handleSave}
          availableCourts={availableCourtNames}
        />
      </main>
    </div>
  );
};

export default Settings;