import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Court } from '@/components/CourtCard';
import { NotificationEntry } from '@/components/NotificationLog';
import { ActivityEntry } from '@/components/ActivityLog';
import { UserPreferences } from '@/components/PreferencesForm';
import { getCourtAvailability } from '@/api/badminton';

interface SystemContextType {
  isActive: boolean;
  toggleSystem: () => void;
  courts: Court[];
  notifications: NotificationEntry[];
  activities: ActivityEntry[];
  preferences: UserPreferences;
  updatePreferences: (prefs: UserPreferences) => void;
  stats: {
    totalScans: number;
    availableCourts: number;
    notificationsSent: number;
    lastScan: Date | null;
  };
}

const defaultPreferences: UserPreferences = {
  email: '',
  preferredTimeSlots: [],
  preferredCourts: [],
  notificationsEnabled: true,
  instantNotifications: true,
};

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// Fetch real court data from backend scraper
const fetchRealCourts = async (): Promise<Court[]> => {
  try {
    const courtsData = await getCourtAvailability();

    return courtsData.map((court, index) => ({
      id: `court-${index + 1}`,
      name: court.courtNumber,
      timeSlot: court.time || court.date.split(' ').slice(-2).join(' ') || '',
      date: court.date.split(' ').slice(0, 3).join(' ') || court.date,
      isAvailable: court.isAvailable,
      location: 'SportUni Hervanta',
    }));
  } catch (error) {
    console.error('Failed to fetch courts:', error);
    return [];
  }
};

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(true);
  const [courts, setCourts] = useState<Court[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [stats, setStats] = useState({
    totalScans: 0,
    availableCourts: 0,
    notificationsSent: 0,
    lastScan: null as Date | null,
  });

  // Initialize courts with real data
  useEffect(() => {
    fetchRealCourts().then(setCourts);
  }, []);

  const addActivity = useCallback((type: ActivityEntry['type'], message: string, details?: string) => {
    const newActivity: ActivityEntry = {
      id: `activity-${Date.now()}-${Math.random()}`,
      type,
      message,
      details,
      timestamp: new Date(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 100));
  }, []);

  const addNotification = useCallback((court: Court) => {
    if (!preferences.email) return;

    const newNotification: NotificationEntry = {
      id: `notif-${Date.now()}-${Math.random()}`,
      courtName: court.name,
      timeSlot: court.timeSlot,
      userEmail: preferences.email,
      sentAt: new Date(),
      status: 'sent',
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setStats(prev => ({ ...prev, notificationsSent: prev.notificationsSent + 1 }));
  }, [preferences.email]);

  // Periodic scanning with real scraper
  useEffect(() => {
    if (!isActive) return;

    const scanCourts = async () => {
      addActivity('scan', 'Initiating court availability scan...');

      try {
        const newCourts = await fetchRealCourts();
        const previousAvailable = courts.filter(c => c.isAvailable).map(c => c.id);
        const newlyAvailable = newCourts.filter(c => c.isAvailable && !previousAvailable.includes(c.id));

        setCourts(newCourts);

        const availableCount = newCourts.filter(c => c.isAvailable).length;
        setStats(prev => ({
          ...prev,
          totalScans: prev.totalScans + 1,
          availableCourts: availableCount,
          lastScan: new Date(),
        }));

        addActivity('success', `Scan completed. Found ${availableCount} available slots.`);

        if (newlyAvailable.length > 0) {
          addActivity('update', `${newlyAvailable.length} new slots detected!`,
            newlyAvailable.map(c => `${c.name} - ${c.timeSlot}`).join(', '));

          if (preferences.notificationsEnabled) {
            newlyAvailable.forEach(court => {
              addNotification(court);
            });
          }
        }
      } catch (error) {
        addActivity('error', 'Scan failed', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    scanCourts();
    const interval = setInterval(scanCourts, 300000);

    return () => clearInterval(interval);
  }, [isActive, courts, addActivity, addNotification, preferences.notificationsEnabled]);

  const toggleSystem = () => {
    setIsActive(prev => {
      const newState = !prev;
      addActivity(
        newState ? 'success' : 'update',
        newState ? 'Monitoring system activated' : 'Monitoring system paused'
      );
      return newState;
    });
  };

  const updatePreferences = (prefs: UserPreferences) => {
    setPreferences(prefs);
    addActivity('success', 'User preferences updated');
  };

  return (
    <SystemContext.Provider value={{
      isActive,
      toggleSystem,
      courts,
      notifications,
      activities,
      preferences,
      updatePreferences,
      stats,
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within SystemProvider');
  }
  return context;
};
