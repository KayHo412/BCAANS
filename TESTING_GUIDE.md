# Testing the Badminton Scraper

## ⚠️ Important Note: Dynamic Content

The SportUni website loads calendar content **dynamically via JavaScript**, which means:

See **Advanced Setup** section below for solutions.
# Testing Guide

> Update: Selenium (`src/services/badmintonScraperSelenium.ts`) is now the primary scraper. Puppeteer implementation has been removed.
## Prerequisites

Ensure you have installed the required dependencies:
```bash
npm install cheerio axios
# For dynamic content, also install:
npm install puppeteer
```

## Testing Methods

### 1. **Quick Test with tsx (Recommended)**

Install tsx globally or as a dev dependency:
```bash
npm install -D tsx
```

Run the test script:
```bash
npx tsx test-scraper.ts
```

**Output Example:**
```
🏸 Starting Badminton Scraper Tests...

Test 1: Scraping available courts...
✓ Scraping completed
  Success: true
  Courts found: 3
  Last updated: 2025-12-29T10:30:00.000Z

Test 2: Court Details (first 5):

  1. kenttä 4
     Date: Ma 29.12.
     Available: true
     Booking URL: https://www.tuni.fi/sportuni/omasivu/?action=booking&id=1036030

  2. kenttä 7
     Date: Ti 30.12.
     Available: true
     Booking URL: https://www.tuni.fi/sportuni/omasivu/?action=booking&id=1036031

Test 3: Testing getAvailableCourts() method...
✓ Retrieved 3 courts

✅ All tests completed successfully!
```

### 2. **Test in a Browser Console**

Add this to a test page or your Dashboard:

```tsx
// Add to Dashboard.tsx or any component
import { useEffect } from 'react';
import { badmintonScraper } from '../services/badmintonScraper';

export function TestScraperButton() {
  const handleTest = async () => {
    try {
      console.log('Starting scrape...');
      const result = await badmintonScraper.scrapeAvailableCourts();
      console.log('Scraping result:', result);
      console.log('Courts:', result.courts);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button onClick={handleTest} className="px-4 py-2 bg-blue-600 text-white rounded">
      Test Scraper
    </button>
  );
}
```

### 3. **Test with React Hook in Component**

Use the `useCourtAvailability` hook directly:

```tsx
import { useCourtAvailability } from '../hooks/useCourtAvailability';
import { CourtAvailabilityViewer } from '../components/CourtAvailabilityViewer';

export function TestPage() {
  const { courts, loading, error, refetch } = useCourtAvailability(true);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Scraper Test</h1>

      <div className="space-y-2">
        <p>Status: {loading ? '⏳ Loading...' : '✅ Ready'}</p>
        {error && <p className="text-red-600">Error: {error}</p>}
        <p>Courts found: {courts.length}</p>
        <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded">
          Refresh
        </button>
      </div>

      <CourtAvailabilityViewer />
    </div>
  );
}
```

### 4. **Manual Testing in Browser DevTools**

1. Open your app in browser: `npm run dev`
2. Open DevTools (F12)
3. Go to Console tab
4. Paste and run:

```javascript
import { badmintonScraper } from './src/services/badmintonScraper.js';

badmintonScraper.getAvailableCourts()
  .then(courts => console.log('Courts:', courts))
  .catch(error => console.error('Error:', error));
```

Note: This won't work directly due to module imports, use method #2 instead.

## What to Test

### ✓ Test Checklist

- [ ] **Scraping completes** without errors
- [ ] **Date parsing** - dates are correctly extracted (e.g., "Ma 29.12.")
- [ ] **Court numbers** - correctly identified (e.g., "kenttä 4")
- [ ] **Booking URLs** - are absolute URLs (start with `https://`)
- [ ] **Reserved courts** - ignored (no "Varattu" entries in results)
- [ ] **Available courts** - only "Varaa" (Book) links extracted
- [ ] **No duplicates** - same court appears only once per time slot
- [ ] **Hook rendering** - `useCourtAvailability` displays courts in component
- [ ] **Refresh works** - refetch button updates data
- [ ] **Error handling** - graceful error messages if site changes

## Debugging

### Enable Verbose Logging

Add debugging to the scraper:

```typescript
// In badmintonScraper.ts - add to parseCalendarPage()
$listItems.each((_, element) => {
  const $element = $(element);
  const text = $element.text().trim();

  console.log('Processing element:', text); // DEBUG

  if ($element.hasClass('ui-li-divider')) {
    currentDate = $element.text().trim();
    console.log('Found date:', currentDate); // DEBUG
  }
  // ... rest of code
});
```

### Common Issues

**Issue: "No courts found"**
- Website structure may have changed
- Check if selectors still match: `.ui-listview`, `.ui-li-divider`, `.ups-dialog-content`
- Use browser DevTools to inspect HTML structure

**Issue: "CORS error"**
- If running in browser: You need a backend proxy
- Cheerio/Axios work fine in Node.js/Electron environments
- Consider Supabase Edge Functions as a proxy

**Issue: "Timeout error"**
- Website may be slow or blocked
- Increase timeout in `fetchPage()`: change `timeout: 10000` to `timeout: 20000`
- Check internet connection

## Performance Metrics

Expected performance on initial scrape:
- Calendar page parse: ~1-2 seconds
- Per detail page: ~1-2 seconds
- Total for 5 events: ~5-10 seconds

If significantly slower, check:
- Network speed
- Website responsiveness
- Number of events to process

## Integration Tests

### Test in Dashboard Component

Add to your Dashboard:

```tsx
import { CourtAvailabilityViewer } from '../components/CourtAvailabilityViewer';

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Other dashboard content */}
      <CourtAvailabilityViewer />
    </div>
  );
}
```

### Test with Periodic Refresh

```tsx
// Refresh every minute (60000 ms) during testing
const { courts } = useCourtAvailability(true, 60000);
```

## Continuous Testing

Add to package.json:

```json
{
  "scripts": {
    "test:scraper": "tsx test-scraper.ts",
    "test:scraper:watch": "tsx watch test-scraper.ts"
  }
}
```

Then run:
```bash
npm run test:scraper
```

## Production Considerations

Before deploying:

1. **Cache Results**: Don't scrape on every request
2. **Rate Limiting**: SportUni may block aggressive scraping
3. **Monitoring**: Log scraper errors for alerts
4. **Fallback**: Provide mock data if scraping fails
5. **Timeout**: Set appropriate timeouts for production

---

## Advanced Setup: Handling Dynamic Content

Since SportUni uses JavaScript to load the calendar, you need a headless browser solution.

### Option A: Use Puppeteer (Recommended for Production)

1. Install Puppeteer:
```bash
npm install puppeteer
```

2. Update `badmintonScraper.ts`:

```typescript
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import type { CourtAvailability, ScraperResult } from '../types/badminton';

export class BadmintonScraperService {
  private static instance: BadmintonScraperService;

  private constructor() {}

  static getInstance(): BadmintonScraperService {
    if (!BadmintonScraperService.instance) {
      BadmintonScraperService.instance = new BadmintonScraperService();
    }
    return BadmintonScraperService.instance;
  }

  /**
   * Fetches HTML content using Puppeteer to execute JavaScript
   */
  private async fetchPageWithBrowser(url: string): Promise<string> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for the calendar to load
      await page.waitForSelector('ul.ui-listview', { timeout: 10000 }).catch(() => {
        console.warn('Calendar list not found, proceeding anyway');
      });

      const html = await page.content();
      return html;
    } finally {
      if (browser) await browser.close();
    }
  }

  // ... rest of the code stays the same, but use fetchPageWithBrowser() instead of fetchPage()
}
```

3. Test with Puppeteer:
```bash
npx tsx test-scraper.ts
```

### Option B: Use Playwright

Similar to Puppeteer but often faster:

```bash
npm install playwright
```

### Option C: Use Selenium

For more complex JavaScript interactions.

### Option D: API-Based Approach

If SportUni has an undocumented API, inspect network requests in DevTools.

---

## Diagnostic Tool

Run the diagnostic to inspect actual website structure:

```bash
npx tsx diagnose-scraper.ts
```

This will show:
- Which HTML elements exist
- What selectors match
- Sample HTML structure
- What needs to be updated

**Current Findings:**
- ✅ Website is accessible
- ❌ Calendar events loaded dynamically (JavaScript-dependent)
- ❌ Static selectors (`.ui-listview`, `.ui-li-divider`) not populated initially
- ✓ Website uses jQuery Mobile framework

---

**Questions?** Check [BADMINTON_SCRAPER.md](BADMINTON_SCRAPER.md) for more details.
