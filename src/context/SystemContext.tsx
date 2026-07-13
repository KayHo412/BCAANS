import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Court } from '@/components/CourtCard';
import { getCourtAvailability } from '@/api/badminton';

interface SystemContextType {
  isActive: boolean;
  toggleSystem: () => void;
  courts: Court[];
  stats: { totalScans: number; availableCourts: number; lastScan: Date | null; lastError: string | null };
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
  const [courts, setCourts] = useState<Court[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0, availableCourts: 0, lastScan: null as Date | null, lastError: null as string | null,
  });
  const scanning = useRef(false);

  const scan = useCallback(async () => {
    if (scanning.current) return;
    scanning.current = true;
    try {
      const nextCourts = await fetchCourts();
      setCourts(nextCourts);
      setStats((previous) => ({
        ...previous, totalScans: previous.totalScans + 1, availableCourts: nextCourts.length,
        lastScan: new Date(), lastError: null,
      }));
    } catch (error) {
      setStats((previous) => ({
        ...previous, lastError: error instanceof Error ? error.message : 'Unable to reach the court API',
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
  return <SystemContext.Provider value={{ isActive, toggleSystem, courts, stats }}>{children}</SystemContext.Provider>;
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemProvider');
  return context;
};
