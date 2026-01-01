# Badminton Scraper - Complete Setup Guide

> Update: Selenium (`src/services/badmintonScraperSelenium.ts`) is now the primary scraper. Puppeteer implementation has been removed.

## 📋 What's Been Created

### Services (2 Implementations)

```
src/services/
├── badmintonScraper.ts                   [Static HTML parsing]
│   ├─ Pros: Fast, simple, lightweight
│   ├─ Cons: Won't work (site uses JavaScript)
│   └─ Use Case: Reference/learning
│
└── badmintonScraperPuppeteer.ts          [Headless browser] ⭐ RECOMMENDED
    ├─ Pros: Real data, works reliably
    ├─ Cons: Slower (30-60s), higher memory
    └─ Use Case: Production
```

### React Integration

```
src/
├── hooks/
│   └── useCourtAvailability.ts           React hook for data fetching
│       ├─ Auto-refresh support
│       ├─ Error handling
│       └─ Loading states
│
├── api/
│   └── badminton.ts                      API handlers
│       └─ Bridges scraper → React
│
└── components/
    └── CourtAvailabilityViewer.tsx       Pre-built UI component
        ├─ Displays courts
        ├─ Shows booking links
        └─ Refresh button
```

### Testing Tools

```
Root/
├── test-scraper.ts                       Quick test (2 seconds)
├── test-scraper-puppeteer.ts             Full test (30-60 seconds) ⭐ USE THIS
└── diagnose-scraper.ts                   Debug website structure
```

### Documentation

```
├── BADMINTON_SCRAPER.md                  Architecture & API docs
├── TESTING_GUIDE.md                      How to test
├── TESTING_SUMMARY.md                    Overview
└── QUICK_REFERENCE.md                    Quick commands
```

## 🚀 Getting Started

### Step 1: Verify Installation

All dependencies are already installed:

```bash
npm list cheerio axios puppeteer tsx
```

### Step 2: Run a Test

**Quick test (static scraper):**
```bash
npm run test:scraper
```

**Full test (Puppeteer - recommended):**
```bash
npm run test:scraper:puppeteer
```

**Diagnose website:**
```bash
npm run diagnose:scraper
```

### Step 3: Use in Your App

Add to Dashboard or any component:

```tsx
import { CourtAvailabilityViewer } from '../components/CourtAvailabilityViewer';

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Your existing content */}
      <CourtAvailabilityViewer />  {/* Add this */}
    </div>
  );
}
```

### Step 4: Run Your App

```bash
npm run dev
```

The component will automatically fetch and display available courts!

## 📊 Data Flow

```
Website (SportUni)
       ↓
   Puppeteer (renders JavaScript)
       ↓
   Cheerio (parses HTML)
       ↓
   CourtAvailability[] (data)
       ↓
   API Handler
       ↓
   React Hook (useCourtAvailability)
       ↓
   Component (CourtAvailabilityViewer)
       ↓
   User Interface
```

## 🔧 Configuration

### Refresh Interval

The component refreshes data every 5 minutes by default. To change:

```tsx
// Refresh every 10 minutes
useCourtAvailability(true, 600000);

// Manual refresh only
useCourtAvailability(true, undefined);

// Don't fetch on mount
useCourtAvailability(false);
```

### Timeout

To handle slow websites, adjust in `badmintonScraperPuppeteer.ts`:

```typescript
// Line ~30 in fetchPageWithBrowser()
await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 60000  // Change from 30000 to 60000
});
```

## 🐛 Debugging

### View Console Output

```tsx
const { courts, loading, error } = useCourtAvailability(true);

console.log('Courts:', courts);
console.log('Loading:', loading);
console.log('Error:', error);
```

### Enable Verbose Logging

Add console.logs to scraper:

```typescript
// In badmintonScraperPuppeteer.ts
console.log(`Found ${$listItems.length} list items`);
console.log(`Found date: ${currentDate}`);
console.log(`Found badminton event on ${currentDate}`);
```

### Check Browser Rendering

```bash
npm run diagnose:scraper
```

This shows what the website actually returns.

## 📱 Integration Examples

### Example 1: Show in Dashboard

```tsx
import { CourtAvailabilityViewer } from '../components/CourtAvailabilityViewer';

export function Dashboard() {
  return <CourtAvailabilityViewer />;
}
```

### Example 2: Use Hook Directly

```tsx
import { useCourtAvailability } from '../hooks/useCourtAvailability';

export function MyComponent() {
  const { courts, loading, error, refetch } = useCourtAvailability();

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <ul>
        {courts.map(court => (
          <li key={`${court.courtNumber}-${court.date}`}>
            {court.courtNumber} ({court.date})
            <a href={court.bookingUrl}>Book</a>
          </li>
        ))}
      </ul>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Example 3: Service Usage

```typescript
import { badmintonScraperPuppeteer } from '../services/badmintonScraperPuppeteer';

// One-off usage
const courts = await badmintonScraperPuppeteer.getAvailableCourts();
console.log(`Found ${courts.length} courts`);
```

## ⚡ Performance Notes

| Operation | Time | Notes |
|-----------|------|-------|
| Static scraper | ~2s | No real data |
| Puppeteer (first) | ~60s | Downloads browser |
| Puppeteer (cached) | ~15-30s | Browser already loaded |
| React component render | <1s | Displays data |
| Auto-refresh interval | 5m | Configurable |

## 🔐 Privacy & Legal

- The scraper respects the website's terms
- Uses a standard Mozilla user-agent
- Includes rate limiting (delays between requests)
- Should not overload the server

## 📦 Dependencies

What was installed:

- **cheerio** - HTML parser (like jQuery for Node.js)
- **axios** - HTTP client (fetching pages)
- **puppeteer** - Headless browser (renders JavaScript)
- **tsx** - Run TypeScript files directly

All dependencies are already in `package.json`.

## 🎯 Next Steps Checklist

- [ ] Run `npm run test:scraper:puppeteer` to verify everything works
- [ ] Add `<CourtAvailabilityViewer />` to your Dashboard
- [ ] Test with `npm run dev`
- [ ] Adjust refresh interval if needed
- [ ] Customize styling in the component
- [ ] Deploy to production

## ❓ Common Questions

**Q: Why is Puppeteer slow?**
A: It launches a full Chrome browser. First run downloads it (~200MB). Subsequent runs reuse the cached version.

**Q: Can I use this in a serverless function?**
A: Yes, but Puppeteer needs special setup. Consider using a service like Browserless.io instead.

**Q: How do I cache the results?**
A: Use React Query or Redis. See docs for examples.

**Q: What if the website changes?**
A: Run `npm run diagnose:scraper` to see the new structure and update the selectors.

## 📚 Documentation

1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Commands & quick setup
2. **[BADMINTON_SCRAPER.md](BADMINTON_SCRAPER.md)** - Full API documentation
3. **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Detailed testing instructions
4. **[TESTING_SUMMARY.md](TESTING_SUMMARY.md)** - Project overview

## 💡 Tips

1. **First run warning**: Puppeteer takes ~60 seconds on first run. This is normal.
2. **Memory usage**: Puppeteer uses ~200MB. Monitor on low-memory systems.
3. **Multiple refreshes**: Don't refresh too frequently (adds load). 5-15 minutes is good.
4. **Error handling**: The hook handles errors gracefully with fallback messages.
5. **Testing**: Always test with `npm run test:scraper:puppeteer` before deploying.

---

**Ready?** Run this to test:
```bash
npm run test:scraper:puppeteer
```

Then add the component to your Dashboard!
