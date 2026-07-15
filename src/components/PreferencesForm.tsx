import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Clock, MapPin, Save, Bell } from "lucide-react";

export interface UserPreferences {
  email: string;
  preferredTimeSlots: string[];
  preferredCourts: string[];
  notificationsEnabled: boolean;
  instantNotifications: boolean;
}

interface PreferencesFormProps {
  initialPreferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
  className?: string;
  availableCourts?: string[];
}

const timeSlots = [
  "06:00 - 07:00",
  "07:00 - 08:00",
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
  "20:00 - 21:00",
  "21:00 - 22:30",
];

// Fallback court list if none provided
const defaultCourts = [
  "kenttä 1",
  "kenttä 2",
  "kenttä 3",
  "kenttä 4",
  "kenttä 5",
  "kenttä 6",
];

export const PreferencesForm = ({
  initialPreferences,
  onSave,
  className,
  availableCourts = defaultCourts,
}: PreferencesFormProps) => {
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Sync form when initialPreferences changes
  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(preferences);
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimeSlot = (slot: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.includes(slot)
        ? prev.preferredTimeSlots.filter((s) => s !== slot)
        : [...prev.preferredTimeSlots, slot],
    }));
  };

  const toggleCourt = (court: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredCourts: prev.preferredCourts.includes(court)
        ? prev.preferredCourts.filter((c) => c !== court)
        : [...prev.preferredCourts, court],
    }));
  };

  const selectAllTimeSlots = () => {
    setPreferences((prev) => ({
      ...prev,
      preferredTimeSlots: [...timeSlots],
    }));
  };

  const clearAllTimeSlots = () => {
    setPreferences((prev) => ({
      ...prev,
      preferredTimeSlots: [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-8", className)}>
      {/* Email Section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Email Settings</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Notification Email</Label>
            <Input
              id="email"
              type="email"
              value={preferences.email}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="your@email.com"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              All availability notifications will be sent to this email
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Notification Preferences</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts when courts become available
              </p>
            </div>
            <Switch
              checked={preferences.notificationsEnabled}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  notificationsEnabled: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between opacity-50 pointer-events-none">
            <div>
              <Label>Instant Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified immediately (vs. batched daily)
              </p>
            </div>
            <Switch checked={preferences.instantNotifications} disabled />
          </div>
          <p className="text-xs text-muted-foreground italic">
            Email notification timing is configured in the backend
          </p>
        </div>
      </div>

      {/* Time Slot Preferences */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Preferred Time Slots</h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllTimeSlots}
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-xs text-muted-foreground">·</span>
            <button
              type="button"
              onClick={clearAllTimeSlots}
              className="text-xs text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select the time slots you're interested in. Leave empty to see all times.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => toggleTimeSlot(slot)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                preferences.preferredTimeSlots.includes(slot)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Court Preferences */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Preferred Courts</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select which courts you'd like to monitor. Leave empty to see all courts.
        </p>

        {availableCourts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No courts available yet. Try again after the first scan.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableCourts.map((court) => (
              <button
                key={court}
                type="button"
                onClick={() => toggleCourt(court)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  preferences.preferredCourts.includes(court)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {court}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button type="submit" size="lg" className="w-full button-glow" disabled={isSaving}>
        {isSaving ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </>
        )}
      </Button>
    </form>
  );
};