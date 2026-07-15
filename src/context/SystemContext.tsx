import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Court } from '@/components/CourtCard';
import { getCourtAvailability } from '@/api/badminton';

interface Profile {
  preferred_courts: string[] | null;
  preferred_time_slots: string[] | null;
}

interface SystemContextType {
  isActive: boolean;
  toggleSystem: () => void;
  courts: Court[];
  allCourts: Court[]; // All courts before filtering
  stats: { totalScans: number; availableCourts: number; lastScan: Date | null; lastError: string | null };
  setProfile: (profile: Profile | null) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

async function fetchCourts(): Promise<Court[]> {
  const courts = await getCourtAvailability();
  return courts.map((court) => ({
    id: `${court.date}-${court.time ?? ''}-${court.courtNumber}`,
    name: court.courtNumber,
    timeSlot: court.time ?? '',
    date: court.date,
    isAvailable: court.isAvailable,
    location: 'SportUni Hervanta',
  }));
}

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(true);
  const [allCourts, setAllCourts] = useState<Court[]>([]);
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    availableCourts: 0,
    lastScan: null as Date | null,
    lastError: null as string | null,
  });
  const scanning = useRef(false);

  // Filter courts based on user preferences
  useEffect(() => {
    if (!profile?.preferred_courts?.length && !profile?.preferred_time_slots?.length) {
      // No filters set, show all courts
      setFilteredCourts(allCourts);
      return;
    }

    const filtered = allCourts.filter((court) => {
      const courtsPreferred = profile.preferred_courts;
      const timesPreferred = profile.preferred_time_slots;

      // If no court preference, don't filter by court
      const courtMatch = !courtsPreferred?.length || courtsPreferred.includes(court.name);

      // If no time preference, don't filter by time
      const timeMatch = !timesPreferred?.length || timesPreferred.includes(court.timeSlot);

      return courtMatch && timeMatch;
    });

    setFilteredCourts(filtered);
  }, [allCourts, profile]);

  const scan = useCallback(async () => {
    if (scanning.current) return;
    scanning.current = true;
    try {
      const nextCourts = await fetchCourts();
      setAllCourts(nextCourts);

      // Count available courts from filtered list (or all if no filter)
      const availableCount = nextCourts.filter(c => c.isAvailable).length;

      setStats((previous) => ({
        ...previous,
        totalScans: previous.totalScans + 1,
        availableCourts: availableCount,
        lastScan: new Date(),
        lastError: null,
      }));
    } catch (error) {
      setStats((previous) => ({
        ...previous,
        lastError: error instanceof Error ? error.message : 'Unable to reach the court API',
      }));
    } finally {
      scanning.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void scan();
    const interval = window.setInterval(() => void scan(), 5 * 60_000);
    return () => window.clearInterval(interval);
  }, [isActive, scan]);

  const toggleSystem = useCallback(() => setIsActive((active) => !active), []);

  return (
    <SystemContext.Provider
      value={{
        isActive,
        toggleSystem,
        courts: filteredCourts,
        allCourts,
        stats,
        setProfile,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemProvider');
  return context;
};