import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Court } from '@/components/CourtCard';
import { NotificationEntry } from '@/components/NotificationLog';
import { ActivityEntry } from '@/components/ActivityLog';
import { UserPreferences } from '@/components/PreferencesForm';

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

// Generate mock courts
const generateMockCourts = (): Court[] => {
  const courts: Court[] = [];
  const courtNames = ['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Court 5', 'Court 6'];
  const timeSlots = ['18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00'];
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  let id = 1;
  [today, tomorrow].forEach((date) => {
    courtNames.forEach((courtName) => {
      timeSlots.forEach((slot) => {
        courts.push({
          id: `court-${id++}`,
          name: courtName,
          timeSlot: slot,
          date: formatDate(date),
          isAvailable: Math.random() > 0.7,
          location: 'Sports Complex',
        });
      });
    });
  });

  return courts;
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

  // Initialize courts
  useEffect(() => {
    setCourts(generateMockCourts());
  }, []);

  // Add activity log
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

  // Add notification
  const addNotification = useCallback((court: Court) => {
    if (!preferences.email) return;
    
    const newNotification: NotificationEntry = {
      id: `notif-${Date.now()}-${Math.random()}`,
      courtName: court.name,
      timeSlot: court.timeSlot,
      userEmail: preferences.email || 'user@example.com',
      sentAt: new Date(),
      status: 'sent',
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setStats(prev => ({ ...prev, notificationsSent: prev.notificationsSent + 1 }));
  }, [preferences.email]);

  // Simulate periodic scanning
  useEffect(() => {
    if (!isActive) return;

    const scanCourts = () => {
      addActivity('scan', 'Initiating court availability scan...');
      
      setTimeout(() => {
        // Simulate finding courts and updating
        const newCourts = generateMockCourts();
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
      }, 1500);
    };

    // Initial scan
    scanCourts();

    // Scan every 30 seconds for demo (would be 5 minutes in production)
    const interval = setInterval(scanCourts, 30000);

    return () => clearInterval(interval);
  }, [isActive, addActivity, addNotification, preferences.notificationsEnabled]);

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
