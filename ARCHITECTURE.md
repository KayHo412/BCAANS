# Architecture & Data Flow

> Update: Selenium (`src/services/badmintonScraperSelenium.ts`) is now the primary scraper. Puppeteer implementation has been removed.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your React App                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          React Components (Dashboard)               │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ <CourtAvailabilityViewer />                         │  │
│  │  - Displays courts                                  │  │
│  │  - Shows availability                              │  │
│  │  - Provides booking links                          │  │
│  └──────────────┬──────────────────────────────────────┘  │
│                 │                                          │
│  ┌──────────────▼──────────────────────────────────────┐  │
│  │         React Hook                                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ useCourtAvailability()                              │  │
│  │  - Manages loading state                            │  │
│  │  - Handles errors                                   │  │
│  │  - Auto-refresh interval                            │  │
│  └──────────────┬──────────────────────────────────────┘  │
│                 │                                          │
│  ┌──────────────▼──────────────────────────────────────┐  │
│  │         API Handler                                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ getCourtAvailability()                              │  │
│  │  - Calls scraper service                            │  │
│  │  - Error handling                                   │  │
│  └──────────────┬──────────────────────────────────────┘  │
│                 │                                          │
└─────────────────┼──────────────────────────────────────────┘
                  │
                  │ (Node.js only - can't run in browser)
                  │
┌─────────────────▼──────────────────────────────────────────┐
│            Scraper Services                               │
├──────────────────────────────────────────────────────────  ┤
│                                                             │
│  Option A: Static Scraper                                  │
│  ┌──────────────────────────────────────────────────┐      │
│  │ badmintonScraper.ts                              │      │
│  │  - Uses Cheerio + Axios only                      │      │
│  │  - Fast (~2s)                                     │      │
│  │  - Returns 0 courts (site uses JS)                │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Option B: Puppeteer Scraper (RECOMMENDED) ⭐              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ badmintonScraperPuppeteer.ts                      │      │
│  │  - Uses Cheerio + Axios + Puppeteer               │      │
│  │  - Slower (~30-60s)                               │      │
│  │  - Returns real court data                         │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ├─► Cheerio (Parse HTML)
                  │
                  ├─► Axios (Fetch Pages)
                  │
                  └─► Puppeteer (Render JavaScript)
                      │
                      └─ (Launches Chrome browser)

┌─────────────────────────────────────────────────────────────┐
│            External Website                                │
├──────────────────────────────────────────────────────────  ┤
│ https://www.tuni.fi/sportuni/omasivu/                     │
│                                                             │
│ 1. Calendar Page (?page=home&lang=en)                      │
│    - Lists all events with dates                           │
│    - JavaScript renders the list                           │
│                                                             │
│ 2. Detail Pages (?action=showevent&id=...)                │
│    - Court availability per time slot                      │
│    - Booking links                                         │
│    - "Varaa" = Available, "Varattu" = Reserved             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
User Action:
  Component Mounts
        │
        ▼
  useCourtAvailability(true)  ◄─ Auto-fetch enabled
        │
        ▼
  getCourtAvailability()      ◄─ API Handler
        │
        ▼
  badmintonScraperPuppeteer.scrapeAvailableCourts()
        │
        ├─ Launch Puppeteer browser
        │
        ├─ Navigate to calendar page
        │
        ├─ Wait for JavaScript to render
        │
        ├─ Parse HTML with Cheerio
        │   │
        │   ├─ Find date dividers
        │   │
        │   └─ Find "Sulkapallo" links
        │
        ├─ For each event:
        │   │
        │   ├─ Navigate to detail page
        │   │
        │   ├─ Wait for content to load
        │   │
        │   ├─ Parse HTML
        │   │
        │   ├─ Extract court info
        │   │   │
        │   │   ├─ Court number (kenttä 4)
        │   │   │
        │   │   ├─ Date (Ma 29.12.)
        │   │   │
        │   │   └─ Booking URL
        │   │
        │   └─ Filter out "Varattu" (reserved)
        │
        ├─ Return CourtAvailability[]
        │
        ▼
  Update React state
        │
        ▼
  Re-render component
        │
        ▼
  Display courts with links
        │
        ▼
  Schedule next refresh (5 minutes later)
```

## Component Integration Flow

```
┌─────────────────────────────────────────────┐
│         Dashboard Component                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Import Component:    │
        │ <CourtAvailability   │
        │  Viewer />           │
        └──────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Hook runs:                   │
        │ useCourtAvailability(        │
        │   true,                      │ ◄─ Auto-fetch
        │   300000                     │ ◄─ 5-min refresh
        │ )                            │
        └──────────────────────────────┘
                   │
                   ├─ Loading: true
                   │ Loading spinner shows...
                   │
                   ├─ Scraper runs (30-60s)
                   │
                   ├─ Loading: false
                   │ Spinner disappears
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Display:                     │
        │  - Court names               │
        │  - Dates                     │
        │  - "Available" badges        │
        │  - "Book" links              │
        │  - Refresh button            │
        └──────────────────────────────┘
                   │
                   ├─ 5 minutes pass
                   │
                   ▼
        Auto-refresh runs again...
```

## File Dependencies

```
Components:
  CourtAvailabilityViewer.tsx
    │
    ├─ imports → useCourtAvailability hook
    │
    ├─ imports → CourtAvailability type
    │
    └─ imports → UI components (Card, Button, Badge, etc.)

Hooks:
  useCourtAvailability.ts
    │
    ├─ imports → getCourtAvailability (API)
    │
    └─ imports → CourtAvailability type

API:
  badminton.ts
    │
    ├─ imports → badmintonScraperPuppeteer service
    │
    └─ imports → CourtAvailability type

Services:
  badmintonScraperPuppeteer.ts
    │
    ├─ imports → puppeteer
    │
    ├─ imports → cheerio
    │
    └─ imports → CourtAvailability type

Types:
  badminton.ts
    └─ Defines: CourtAvailability, ScraperResult
```

## Testing Architecture

```
npm run test:scraper
    │
    └─► test-scraper.ts
        │
        ├─ Imports badmintonScraper (static)
        │
        ├─ Calls scrapeAvailableCourts()
        │
        ├─ No real browser, just HTML parsing
        │
        └─ Result: ~2 seconds, 0 courts ✗


npm run test:scraper:puppeteer
    │
    └─► test-scraper-puppeteer.ts
        │
        ├─ Imports badmintonScraperPuppeteer
        │
        ├─ Launches Puppeteer browser
        │
        ├─ Navigates to live website
        │
        ├─ Waits for JavaScript to load
        │
        ├─ Parses actual HTML
        │
        └─ Result: ~30-60 seconds, real courts ✓


npm run diagnose:scraper
    │
    └─► diagnose-scraper.ts
        │
        ├─ Fetches website HTML
        │
        ├─ Inspects structure
        │
        ├─ Tests selectors
        │
        └─ Reports findings
```

## Performance Characteristics

```
Static Scraper:
  Launch time:      <1s
  Parse time:       ~1-2s
  Total time:       ~2s
  Memory usage:     ~50MB
  CPU usage:        Low
  Results:          0 courts (incomplete)
  Reliability:      Medium (breaks if HTML structure changes)

Puppeteer Scraper:
  Browser launch:   ~10-30s (first time), ~5s (cached)
  Navigation:       ~5-10s
  JS Rendering:     ~10-20s
  Parse time:       ~1-2s
  Total time:       ~30-60s (first), ~15-30s (subsequent)
  Memory usage:     ~200-300MB
  CPU usage:        High
  Results:          Real court data
  Reliability:      High (handles dynamic content)

React Component:
  Render time:      <1ms
  Re-render:        <1ms (with data)
  Mount time:       <10ms
  Memory:           ~10MB
```

---

**Need help?** Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) or [TESTING_GUIDE.md](TESTING_GUIDE.md)
