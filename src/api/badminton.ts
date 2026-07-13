import type { CourtAvailability } from '../types/badminton';

/**
 * Fetch court data from the single Node/Selenium backend.
 */
export async function getCourtAvailability(): Promise<CourtAvailability[]> {
  try {
    const response = await fetch('/api/courts');

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) throw new Error(data.error || 'Scraping failed');

    return data.courts || [];

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
