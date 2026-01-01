# Quick Reference - Badminton Scraper (Selenium)

## Run Tests

```bash
# Full scrape (headless Chrome via Selenium)
npm run test:scraper:selenium

# Quick scrape (same Selenium service)
npm run test:scraper

# Diagnose website structure (static fetch)
npm run diagnose:scraper
```

## Use in Components

```tsx
import { useCourtAvailability } from '../hooks/useCourtAvailability';

export function Dashboard() {
  const { courts, loading, error, refetch } = useCourtAvailability(true, 300000);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {courts.map(court => (
        <div key={`${court.courtNumber}-${court.date}`}>
          {court.courtNumber} – {court.date}
          <a href={court.bookingUrl}>Book</a>
        </div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## Files

```
Core Logic:
  src/services/badmintonScraperSelenium.ts   ← Selenium scraper (primary)
  src/types/badminton.ts                     ← Types

API / Hook:
  src/api/badminton.ts                       ← API handler
  src/hooks/useCourtAvailability.ts          ← React hook

Testing:
  test-scraper.ts                            ← Selenium test (short)
  test-scraper-selenium.ts                   ← Selenium test (full)
  diagnose-scraper.ts                        ← Diagnostic tool
```

## Troubleshooting

- First Selenium run can take 20–60s (Chrome startup).
- If no courts are found, the site may have no availability right now.
- Increase waits in `src/services/badmintonScraperSelenium.ts` (`WAIT_FOR_LIST_MS`, `WAIT_FOR_DIALOG_MS`) if the site is slow.

## Next Steps

1. Run `npm run test:scraper:selenium`.
2. Wire the hook into your dashboard UI.
3. Deploy once data loads correctly.
