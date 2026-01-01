# Badminton Court Scraper

> Note: Selenium (`src/services/badmintonScraperSelenium.ts`) is now the primary scraper. Puppeteer has been removed.

A TypeScript web scraper for SportUni Badminton court availability using Cheerio and Axios.

## Architecture

### Core Components

1. **BadmintonScraperService** (`src/services/badmintonScraper.ts`)
   - Singleton service for scraping court availability
   - Parses calendar page to find badminton events
   - Parses detail pages to extract available courts
   - Includes Mozilla user-agent to avoid blocking

2. **Types** (`src/types/badminton.ts`)
   - `CourtAvailability`: Interface for court data
   - `ScraperResult`: Interface for scraper results

3. **API Handler** (`src/api/badminton.ts`)
   - Exposes scraper functionality to React components
   - Handles error management

4. **Custom Hook** (`src/hooks/useCourtAvailability.ts`)
   - `useCourtAvailability()`: React hook for fetching and managing court data
   - Supports auto-fetching and periodic refresh intervals

5. **Example Component** (`src/components/CourtAvailabilityViewer.tsx`)
   - Demonstrates how to use the scraper in your app
   - Displays court availability with booking links

## Usage

### Basic Usage in Components

```typescript
import { useCourtAvailability } from '../hooks/useCourtAvailability';

export function MyComponent() {
  // Auto-fetch on mount, refresh every 5 minutes
  const { courts, loading, error, refetch } = useCourtAvailability(true, 300000);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {courts.map(court => (
        <div key={court.courtNumber}>
          <p>{court.courtNumber} - {court.date}</p>
          <a href={court.bookingUrl}>Book</a>
        </div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { badmintonScraper } from '../services/badmintonScraper';

const courts = await badmintonScraper.getAvailableCourts();
const result = await badmintonScraper.scrapeAvailableCourts();
```

## Scraping Process

### Step 1: Parse Calendar Page
- Connects to `https://www.tuni.fi/sportuni/omasivu/?page=home&lang=en`
- Iterates through `<li>` elements in `ul.ui-listview`
- Identifies dates from elements with class `ui-li-divider`
- Finds badminton events by looking for links containing "Sulkapallo"
- Extracts relative href and converts to absolute URLs

### Step 2: Parse Detail Pages
- Connects to the detail page URL from Step 1
- Locates `<div class="ups-dialog-content">`
- Processes each `<p>` tag:
  - Skips lines containing "Varattu" (Reserved)
  - Extracts data from lines with "Varaa" (Book) links
  - Extracts court number (e.g., "kenttä 4")
  - Resolves booking URLs against base URL

## Configuration

### Refresh Interval
The refresh interval (in milliseconds) can be customized:

```typescript
// Refresh every 10 minutes
useCourtAvailability(true, 600000);

// Manual refresh only (no automatic refresh)
useCourtAvailability(true, undefined);

// Don't auto-fetch on mount
useCourtAvailability(false);
```

### User-Agent
The scraper uses:
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

To modify, edit the `fetchPage()` method in `BadmintonScraperService`.

## Error Handling

The scraper includes comprehensive error handling:

```typescript
const { courts, error, loading } = useCourtAvailability();

if (error) {
  console.error('Scraping failed:', error);
  // Handle error appropriately
}
```

## Performance Considerations

- **Caching**: Consider implementing Redis or IndexedDB for caching
- **Rate Limiting**: The scraper includes 500ms delays between requests
- **Timeout**: HTTP requests timeout after 10 seconds
- **Lazy Loading**: Use the hook's `autoFetch` parameter to control when scraping starts

## Troubleshooting

### No courts found
- Check if the website structure has changed
- Verify the selector patterns match current HTML
- Check browser console for specific parsing errors

### CORS Issues (if calling from browser)
- Since we're using Node.js libraries (Cheerio/Axios), this should work in Electron or Node.js backends
- For browser-only environments, you may need a backend proxy
- Consider creating a serverless function (Supabase Edge Function, Vercel API) as a proxy

### Slow scraping
- Increase the delay in the `parseCalendarPage()` loop if needed
- Consider only scraping specific days instead of all events

## Future Enhancements

1. **Caching Layer**: Add Redis or Supabase caching
2. **Background Jobs**: Use node-cron for periodic scraping
3. **Notifications**: Alert users when courts become available
4. **Database Storage**: Store historical availability data
5. **Multi-sport Support**: Extend to other sports besides badminton

## Dependencies

- `axios`: HTTP client for fetching pages
- `cheerio`: Fast jQuery-like syntax for parsing HTML
- `typescript`: Type safety
- Existing React dependencies (React, React Router, etc.)

## File Structure

```
src/
├── services/
│   └── badmintonScraper.ts         # Core scraper service
├── api/
│   └── badminton.ts                 # API handlers
├── hooks/
│   └── useCourtAvailability.ts      # React hook
├── components/
│   └── CourtAvailabilityViewer.tsx  # Example component
└── types/
    └── badminton.ts                 # Type definitions
```
