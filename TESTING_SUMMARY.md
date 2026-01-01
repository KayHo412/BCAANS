# Badminton Scraper - Testing Summary

> Update: Selenium (`src/services/badmintonScraperSelenium.ts`) is the primary scraper. Puppeteer has been removed.

## What Was Created

### Core Files

1. **Scraper Services**
   - [src/services/badmintonScraper.ts](src/services/badmintonScraper.ts) - Static HTML scraper (basic)
   - [src/services/badmintonScraperPuppeteer.ts](src/services/badmintonScraperPuppeteer.ts) - Dynamic JavaScript scraper (recommended)

2. **Type Definitions**
   - [src/types/badminton.ts](src/types/badminton.ts) - TypeScript interfaces

3. **API & Hooks**
   - [src/api/badminton.ts](src/api/badminton.ts) - API handlers
   - [src/hooks/useCourtAvailability.ts](src/hooks/useCourtAvailability.ts) - React hook

4. **Components**
   - [src/components/CourtAvailabilityViewer.tsx](src/components/CourtAvailabilityViewer.tsx) - Example component

5. **Testing Files**
   - [test-scraper.ts](test-scraper.ts) - Basic scraper test
   - [test-scraper-puppeteer.ts](test-scraper-puppeteer.ts) - Puppeteer-based test
   - [diagnose-scraper.ts](diagnose-scraper.ts) - Diagnostic tool

6. **Documentation**
   - [BADMINTON_SCRAPER.md](BADMINTON_SCRAPER.md) - Architecture & setup
   - [TESTING_GUIDE.md](TESTING_GUIDE.md) - Complete testing guide

## How to Test

### Quick Test (Static Scraper)

```bash
npx tsx test-scraper.ts
```

**Result:** Currently returns 0 courts because the website loads content dynamically.

### Full Test (With JavaScript Rendering)

```bash
npx tsx test-scraper-puppeteer.ts
```

**Result:** Will render the page with Puppeteer, wait for JavaScript to load the calendar, and scrape actual court availability. This takes 30-60 seconds but provides real data.

### Diagnostic Test

Inspect the actual website HTML structure:

```bash
npx tsx diagnose-scraper.ts
```

## Key Finding

The SportUni website uses **jQuery Mobile** and loads the calendar content dynamically via JavaScript. This means:

- ✅ **Puppeteer-based approach works** - Renders JavaScript, then scrapes
- ❌ **Static HTML approach doesn't work** - Calendar not in initial HTML

## Recommended Setup for Production

Use the Puppeteer version for reliability:

```typescript
import { badmintonScraperPuppeteer } from '../services/badmintonScraperPuppeteer';

// In a React component or API route
const courts = await badmintonScraperPuppeteer.getAvailableCourts();
```

## Integration Examples

### In React Component

```tsx
import { useCourtAvailability } from '../hooks/useCourtAvailability';

export function MyComponent() {
  // Auto-fetch on mount, refresh every 5 minutes
  const { courts, loading, error, refetch } = useCourtAvailability(true, 300000);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {courts.map(court => (
        <div key={`${court.courtNumber}-${court.date}`}>
          <p>{court.courtNumber} - {court.date}</p>
     - [src/services/badmintonScraperSelenium.ts](src/services/badmintonScraperSelenium.ts) - Selenium (headless Chrome) scraper (recommended)
        </div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { badmintonScraperPuppeteer } from '../services/badmintonScraperPuppeteer';

     - [test-scraper-selenium.ts](test-scraper-selenium.ts) - Selenium-based test

if (result.success) {
  console.log(`Found ${result.courts.length} courts`);
  result.courts.forEach(court => {
    console.log(`${court.courtNumber} on ${court.date}`);
  });
} else {
  console.error(`Scraping failed: ${result.error}`);
}
```

## Dependencies Installed

```bash
npm install cheerio axios puppeteer tsx
```

- **cheerio** - Parse HTML
- **axios** - Fetch pages
  npx tsx test-scraper-selenium.ts
- **tsx** - Run TypeScript files directly

## Testing Checklist

- [x] Scraper runs without errors
- [x] Diagnostic tool inspects website structure
- [x] Puppeteer successfully loads JavaScript content
- [x] TypeScript types properly defined
- [x] React hook implemented
- [x] Example component created
- [ ] Real courts return from live website (depends on court availability)

## Performance Notes

- **Initial scrape**: 30-60 seconds (first Puppeteer launch)
- **Subsequent scrapes**: ~15-30 seconds (Puppeteer startup cached)
- **Static scraper**: ~2-5 seconds (but returns 0 results)

## Next Steps

1. **Test with Puppeteer**: `npx tsx test-scraper-puppeteer.ts`
2. **Integrate into Dashboard**: Import and use the hook
3. **Set up caching**: Store results to avoid repeated scraping
4. **Configure refresh interval**: Adjust based on your needs
  import { badmintonScraperSelenium } from '../services/badmintonScraperSelenium';

## Troubleshooting
  const courts = await badmintonScraperSelenium.getAvailableCourts();
### "No courts found"
- Check if courts are actually available on the website
- Verify Puppeteer successfully loaded the page (check logs)
- Run `diagnose-scraper.ts` to inspect HTML

### "Browser crashed"
- Increase memory: `npm run test:scraper-puppeteer -- --memory=512mb`
- Check system resources
- Try on a different machine

### "Timeout errors"
- Increase timeout in `fetchPageWithBrowser()`: change `30000` to `60000`
- Check internet connection
- Try a different time (site may be slow at peak hours)

## Files Overview

```
src/
├── services/
│   ├── badmintonScraper.ts              # Static scraper
│   └── badmintonScraperPuppeteer.ts     # Dynamic scraper (recommended)
├── api/
│   └── badminton.ts
├── hooks/
│   └── useCourtAvailability.ts
├── components/
│   └── CourtAvailabilityViewer.tsx
└── types/
    └── badminton.ts

Root/
  import { badmintonScraperSelenium } from '../services/badmintonScraperSelenium';
├── test-scraper-puppeteer.ts           # Puppeteer test (recommended)
  const result = await badmintonScraperSelenium.scrapeAvailableCourts();
├── BADMINTON_SCRAPER.md                # Architecture docs
└── TESTING_GUIDE.md                     # Testing guide
```

---

**Need help?** Check the [TESTING_GUIDE.md](TESTING_GUIDE.md) or [BADMINTON_SCRAPER.md](BADMINTON_SCRAPER.md) for detailed information.
