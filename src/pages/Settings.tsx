import { Navigation } from "@/components/Navigation";
import { PreferencesForm, UserPreferences } from "@/components/PreferencesForm";
import { useAuth } from "@/context/AuthContext";
import { Settings as SettingsIcon, Info } from "lucide-react";

const Settings = () => {
  const { profile, updateProfile } = useAuth();

  const initialPreferences: UserPreferences = {
    email: profile?.email || '',
    preferredTimeSlots: profile?.preferred_time_slots || [],
    preferredCourts: profile?.preferred_courts || [],
    notificationsEnabled: profile?.notifications_enabled ?? true,
    instantNotifications: true,
  };

  const handleSave = async (prefs: UserPreferences) => {
    await updateProfile({
      email: prefs.email,
      preferred_time_slots: prefs.preferredTimeSlots,
      preferred_courts: prefs.preferredCourts,
      notifications_enabled: prefs.notificationsEnabled,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure your notification preferences and monitoring options.
            </p>
          </div>

          {/* Info Banner */}
          <div className="glass-card p-4 mb-8 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground font-medium mb-1">How notifications work</p>
              <p className="text-muted-foreground">
                The system scans for court availability every 5 minutes. When a court matching your preferences becomes available, 
                you'll receive an email notification instantly. Make sure to set your preferred time slots and courts below.
              </p>
            </div>
          </div>

          {/* Preferences Form */}
          <PreferencesForm 
            initialPreferences={initialPreferences}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
