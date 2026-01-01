export interface CourtAvailability {
  date: string; // Format: "Ma 29.12."
  time?: string; // Optional time if available
  courtNumber: string; // e.g., "kenttä 4"
  bookingUrl: string; // Absolute URL for booking
  isAvailable: boolean;
}

export interface ScraperResult {
  success: boolean;
  courts: CourtAvailability[];
  error?: string;
  lastUpdated?: Date;
}
