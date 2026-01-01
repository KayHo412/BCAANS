import { badmintonScraperSelenium } from '../services/badmintonScraperSelenium';
import type { CourtAvailability } from '../types/badminton';

/**
 * API handler for badminton court availability
 * Can be called from frontend components
 */
export async function getCourtAvailability(): Promise<CourtAvailability[]> {
  try {
    const courts = await badmintonScraperSelenium.getAvailableCourts();
    return courts;
  } catch (error) {
    console.error('Failed to get court availability:', error);
    throw error;
  }
}

/**
 * Refresh court availability (useful for periodic updates)
 */
export async function refreshCourtAvailability(): Promise<CourtAvailability[]> {
  return getCourtAvailability();
}
