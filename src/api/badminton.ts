import type { CourtAvailability } from '../types/badminton';

/**
 * API handler for badminton court availability
 * Calls backend scraper service running on Node.js
 */
export async function getCourtAvailability(): Promise<CourtAvailability[]> {
  try {
    // Call the backend server (make sure it's running with: npm run server)
    const response = await fetch('http://localhost:3001/api/scrape');

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('Scraping failed:', data.error);
      return [];
    }

    return data.courts || [];

  } catch (error) {
    console.error('Failed to get court availability:', error);
    // Return empty array on error instead of throwing to prevent UI crashes
    return [];
  }
}

/**
 * Refresh court availability (useful for periodic updates)
 */
export async function refreshCourtAvailability(): Promise<CourtAvailability[]> {
  return getCourtAvailability();
}
