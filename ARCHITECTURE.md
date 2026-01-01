# System Architecture

## Overview

BCAANS follows a modern full-stack architecture with clear separation of concerns between frontend (React) and backend (Node.js automation). The system is designed for scalability, maintainability, and real-time data synchronization.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Layer                              │
│  Dashboard (React) | Notifications | Preferences            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Application Layer                              │
│  React Components & State Management                        │
│  - Dashboard.tsx                                            │
│  - SystemContext.tsx (Global State)                        │
│  - Custom Hooks (useCourtAvailability)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Service Layer                                  │
│  API Handlers (src/api/badminton.ts)                       │
│  - getCourtAvailability()                                  │
│  - refreshCourtAvailability()                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Business Logic Layer                           │
│  Scraper Service (src/services/)                            │
│  - badmintonScraperSelenium.ts                              │
│  - Notifier Service (automation/)                           │
│  - badminton-notifier-selenium.ts                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              External Integrations                          │
│  Selenium + Cheerio | Nodemailer | Supabase | Tuni Website │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Structure
```
src/
├── components/          # React components
├── pages/              # Page components
├── context/            # State management (SystemContext)
├── hooks/              # Custom React hooks
├── services/           # Business logic
├── api/                # API handlers
├── types/              # TypeScript types
└── lib/                # Utilities
```

### Backend Structure
```
automation/             # Notifier CLI script
supabase/              # Database & functions
  ├── functions/
  └── migrations/
```

---

## Data Flow

### Real-Time Dashboard
User Opens Dashboard → Hook triggers → API call → Display results → Auto-refresh (30s)

### Background Notifier
PM2 Cron (4h) → Scrape → Compare state → Send email → Save state → Exit

---

## State Management

### React Context
- **isActive**: System monitoring state
- **courts**: Available courts array
- **notifications**: Email notification history
- **activities**: System activity log
- **preferences**: User preferences
- **stats**: Metrics and counters

---

## Error Handling

### Scraper
- Graceful degradation on failures
- Automatic retry on network errors
- Comprehensive logging

### Notifier
- Config validation before execution
- SMTP error handling with retry
- Email delivery verification

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Node.js + Selenium + Nodemailer |
| Build | Vite |
| Process Manager | PM2 |
| Database | Supabase (optional) |
| Styling | shadcn/ui + Tailwind |

---

## Performance

| Metric | Target |
|--------|--------|
| Dashboard Load | <1s |
| Scraper Runtime | 30-60s |
| Email Delivery | <5s |
| Memory Usage | <500MB |
| Uptime | >99% |

---

## Deployment Architecture

### Development
- Vite dev server (localhost:5173)
- HMR enabled
- Mock data service

### Production
- Frontend: Vercel / Netlify (CDN)
- Backend: Self-hosted VPS with PM2
- Database: Supabase Cloud (optional)

---

## Security Architecture

### Data Protection
- Sensitive data in `.env` (not in git)
- HTTPS enforced on production
- Input validation on all forms
- API keys separated (public/private)

### Infrastructure Security
- CORS configured for trusted origins
- Rate limiting on API endpoints (future)
- SMTP credentials encrypted
- Auto-rotation of secrets

### Monitoring
- Error tracking (future: Sentry)
- PM2 logs for debugging
- Health checks every 5 minutes
- Uptime monitoring

---

## Maintenance & Operations

### Regular Tasks
- **Daily**: Monitor PM2 logs, check email delivery
- **Weekly**: Review scraper effectiveness
- **Monthly**: Update dependencies, audit security
- **Quarterly**: Performance optimization

### Monitoring
- `pm2 status` - Process health
- `pm2 logs` - Application logs
- `npm run diagnose:scraper` - Scraper diagnostics

### Debugging
```bash
# View real-time logs
pm2 logs badminton-notifier

# Check process status
pm2 status

# Monitor system resources
pm2 monit

# Restart if needed
pm2 restart badminton-notifier
```

---

## Scalability Roadmap

### Phase 1 (Current)
- Single Selenium instance
- Sequential URL processing
- File-based state storage

### Phase 2 (Planned)
- Redis for state caching
- Multiple scraper workers
- Database state persistence

### Phase 3 (Future)
- Distributed scraping
- Load balancing
- Real-time database sync

---

For detailed documentation, see [README.md](README.md)
