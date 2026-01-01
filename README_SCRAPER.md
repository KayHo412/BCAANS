# 🏸 Badminton Court Scraper - Complete Documentation Index

Welcome! This is your complete guide to testing the badminton court scraper.

## 🚀 Quick Start (5 minutes)

```bash
# Test the scraper (Selenium)
npm run test:scraper:selenium

# Run your app
npm run dev

# Add to Dashboard component
# <CourtAvailabilityViewer />
```

## 📚 Documentation Files

### For Quick Setup
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ← Start here!
  - Commands at a glance
  - Quick integration examples
  - Troubleshooting

### For Complete Understanding
- **[COMPLETE_SETUP.md](COMPLETE_SETUP.md)**
  - Step-by-step setup
  - Configuration options
  - Integration examples
  - Performance notes

- **[ARCHITECTURE.md](ARCHITECTURE.md)**
  - System diagram
  - Data flow
  - File dependencies
  - Performance characteristics

### For Detailed Reference
- **[BADMINTON_SCRAPER.md](BADMINTON_SCRAPER.md)**
  - Full API documentation
  - Architecture details
  - Configuration options
  - Future enhancements

- **[TESTING_GUIDE.md](TESTING_GUIDE.md)**
  - Testing methods
  - Debugging tips
  - Advanced setups (Puppeteer, Playwright)
  - Troubleshooting

- **[TESTING_SUMMARY.md](TESTING_SUMMARY.md)**
  - Project overview
  - Integration examples
  - Performance metrics
  - Production considerations

## 📂 File Structure

```
src/
├── services/
│   └── badmintonScraperSelenium.ts         # Selenium (headless Chrome) scraper ⭐
├── api/
│   └── badminton.ts                        # API handlers
├── hooks/
│   └── useCourtAvailability.ts             # React hook for data fetching
├── components/
│   └── CourtAvailabilityViewer.tsx         # Pre-built UI component
└── types/
    └── badminton.ts                        # TypeScript types

Root/
├── test-scraper.ts                         # Selenium test (quick)
├── test-scraper-selenium.ts                # Full Selenium test (30-60 seconds) ⭐
├── diagnose-scraper.ts                     # Debug website structure
└── package.json                            # npm scripts added
```

## 🎯 What's Installed

### Dependencies
- **cheerio** - Fast jQuery-like HTML parser
- **axios** - HTTP client for fetching pages
- **selenium-webdriver** - Headless Chrome via Selenium
- **tsx** - TypeScript runner for test scripts

### npm Scripts
```bash
npm run test:scraper              # Selenium test
npm run test:scraper:selenium     # Full Selenium run (30-60s) ⭐ USE THIS
npm run diagnose:scraper          # Diagnose website structure
npm run dev                       # Start development server
npm run build                     # Build for production
```

## 🔑 Key Findings

### The Website Challenge
SportUni uses **jQuery Mobile** to dynamically load the calendar via JavaScript.

| Approach | Speed | Real Data | Solution |
|----------|-------|-----------|----------|
| Static HTML (removed) | ⚡ 2s | ❌ No | Deprecated |
| Selenium (headless Chrome) | 🐢 20-60s | ✅ Yes | **Use this** |

### The Solution
We use a single implementation:
1. **Selenium Scraper** - Headless Chrome driven by Selenium; renders JS and returns real data

## 💻 How to Use

### In React Components

```tsx
import { CourtAvailabilityViewer } from '../components/CourtAvailabilityViewer';

export function Dashboard() {
  return <CourtAvailabilityViewer />;  // That's it!
}
```

### With Custom Hook

```tsx
import { useCourtAvailability } from '../hooks/useCourtAvailability';

export function MyComponent() {
  const { courts, loading, error, refetch } = useCourtAvailability(
    true,      // auto-fetch on mount
    300000     // refresh every 5 minutes
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {courts.map(court => (
        <div key={`${court.courtNumber}-${court.date}`}>
          {court.courtNumber} - {court.date}
          <a href={court.bookingUrl}>Book</a>
        </div>
      ))}
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { badmintonScraperSelenium } from '../services/badmintonScraperSelenium';

const courts = await badmintonScraperSelenium.getAvailableCourts();
console.log(`Found ${courts.length} courts`);
```

## 🧪 Testing

### Test 1: Quick Verification (2 seconds)
```bash
npm run test:scraper
```
✓ Verifies setup works
✗ Returns 0 courts (expected)

### Test 2: Full Scrape (30-60 seconds)
```bash
npm run test:scraper:selenium
```
✓ Launches headless Chrome via Selenium
✓ Renders JavaScript
✓ Returns actual court data
✓ This is what you'll use

### Test 3: Debug (if needed)
```bash
npm run diagnose:scraper
```
Shows actual website HTML structure

## 📊 Data Structure

### CourtAvailability Object
```typescript
{
  date: string;           // "Ma 29.12." - formatted date
  time?: string;          // Optional time slot
  courtNumber: string;    // "kenttä 4" - court number
  bookingUrl: string;     // Full URL for booking
  isAvailable: boolean;   // true if available
}
```

## ⚙️ Configuration

### Refresh Interval
```tsx
// Default: 5 minutes
useCourtAvailability(true, 300000);

// Custom: 10 minutes
useCourtAvailability(true, 600000);

// Manual only
useCourtAvailability(true, undefined);
```

### Timeout (slow websites)
Edit in `badmintonScraperSelenium.ts`, increase `WAIT_FOR_LIST_MS` / `WAIT_FOR_DIALOG_MS` as needed.

## 🐛 Troubleshooting

**Q: Selenium run is slow?**
A: First run: 30-60s (Chrome startup). Subsequent: ~15-30s.

**Q: No courts found?**
A: Check if courts are available at https://www.tuni.fi/sportuni/omasivu/

**Q: Import errors?**
A: Verify file paths in your component match your project structure.

**See [TESTING_GUIDE.md](TESTING_GUIDE.md) for more solutions.**

## 📈 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| test:scraper | ~2s | Basic test, no real data |
| test:scraper:selenium | 30-60s | Full browser, real data |
| React component | <1ms | Just displays data |
| Auto-refresh | 5m | Configurable |

## 🎓 Learning Path

1. **Read**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (5 min)
2. **Test**: `npm run test:scraper:selenium` (30 sec)
3. **Integrate**: Add component to Dashboard (5 min)
4. **Learn**: [ARCHITECTURE.md](ARCHITECTURE.md) (10 min)
5. **Deep Dive**: [BADMINTON_SCRAPER.md](BADMINTON_SCRAPER.md) (20 min)

## ✅ Checklist

- [x] Install dependencies
- [x] Create scraper services
- [x] Create React integration
- [x] Create test files
- [x] Add npm scripts
- [ ] Run `npm run test:scraper:puppeteer`
- [ ] Add component to Dashboard
- [ ] Test in browser
- [ ] Deploy to production

## 🚀 Production Checklist

Before deploying:

- [ ] Test with `npm run test:scraper:puppeteer`
- [ ] Component works in development
- [ ] Error handling is proper
- [ ] Refresh interval is reasonable (5-15 min)
- [ ] No console errors
- [ ] Mockup courts for fallback
- [ ] Monitor server resources
- [ ] Have a rollback plan

## 📞 Questions?

| Question | Answer | Location |
|----------|--------|----------|
| How do I test? | Use npm scripts | [TESTING_GUIDE.md](TESTING_GUIDE.md) |
| How do I use? | Import component | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) |
| How does it work? | See diagrams | [ARCHITECTURE.md](ARCHITECTURE.md) |
| What can I configure? | See API docs | [BADMINTON_SCRAPER.md](BADMINTON_SCRAPER.md) |
| What's the structure? | See file list | [COMPLETE_SETUP.md](COMPLETE_SETUP.md) |

## 🎯 Next Steps

### Right Now
```bash
npm run test:scraper:puppeteer
```

### In 5 Minutes
Add to Dashboard:
```tsx
import { CourtAvailabilityViewer } from '../components/CourtAvailabilityViewer';

export function Dashboard() {
  return <CourtAvailabilityViewer />;
}
```

### Then
```bash
npm run dev
# Visit http://localhost:5173
```

## 📝 Summary

✅ **What was created:**
- Two scraper implementations (static + Puppeteer)
- React integration (hook + component)
- Test suite
- Complete documentation

✅ **What you need to do:**
1. Run test: `npm run test:scraper:puppeteer`
2. Add component to Dashboard
3. Done!

---

**Ready?** Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md) or run:
```bash
npm run test:scraper:puppeteer
```

Good luck! 🏸
