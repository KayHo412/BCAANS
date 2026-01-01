# BCAANS - Badminton Court Availability Automated Notification System

<div align="center">

[![Node.js](https://img.shields.io/badge/node.js-v24.7.0-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Selenium](https://img.shields.io/badge/Selenium-4.27-43b02a?style=flat-square&logo=selenium)](https://www.selenium.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)](#)

Real-time badminton court availability tracker with automated email notifications for SportUni Hervanta facility.

[Features](#key-features) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

## Overview

BCAANS is a full-stack application that monitors badminton court availability in real-time and sends automated notifications when preferred courts become available. The system uses web scraping to extract live data from the Tuni Sports Center website and provides both a modern web dashboard and automated email notifications.

### Key Features

- 🎯 **Real-time Monitoring** - Continuously scrapes court availability
- 📧 **Automated Notifications** - Email alerts when courts become available
- 📊 **Interactive Dashboard** - Modern React-based UI with real-time updates
- 🔄 **Background Service** - PM2-managed process that runs 24/7
- 🎯 **Smart Filtering** - Weekend slot filtering and preference-based notifications
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

---

## Tech Stack

### Frontend
- **React** 18.3 - UI library
- **TypeScript** 5.8 - Type safety
- **Vite** 5.4 - Build tool & dev server
- **Tailwind CSS** 3.4 - Styling
- **shadcn/ui** - Component library

### Backend & Automation
- **Node.js** 24.7 - Runtime
- **Selenium 4.27** - Web scraping
- **Nodemailer** 6.10 - Email delivery
- **Cheerio** 1.1 - HTML parsing

### Infrastructure
- **PM2** - Process management & auto-restart
- **Supabase** - Authentication & database
- **Git** - Version control

---

## Quick Start

### Prerequisites
- Node.js 20+ ([Install](https://nodejs.org/))
- npm or yarn
- Chrome/Chromium browser (for Selenium)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/BCAANS.git
cd BCAANS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

Create a `.env` file:

```env
# Email Configuration
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=recipient1@example.com,recipient2@example.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Supabase (Optional)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

### Running the Application

**Development Mode:**
```bash
# Start web dashboard (http://localhost:5173)
npm run dev
```

**Automated Notifier (with PM2):**
```bash
# Start the notifier service
pm2 start "npm run notify:selenium" --name "badminton-notifier"

# View logs
pm2 logs badminton-notifier
```

---

## Architecture

### System Design

```
┌─────────────────────────────────────────┐
│     React Dashboard (Frontend)           │
│  - Court availability display            │
│  - Real-time notifications               │
│  - User preferences                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  SystemContext (State Management)        │
│  - Courts state                          │
│  - Notifications state                   │
│  - System status                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Selenium Scraper Service                │
│  - Web scraping (Chrome headless)        │
│  - HTML parsing (Cheerio)                │
│  - Error handling & retry logic          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Tuni Sports Center Website              │
│  - Live court availability data          │
│  - Real-time booking information         │
└─────────────────────────────────────────┘
```

### File Structure

```
src/
├── components/          # React components
├── pages/              # Page components
├── context/            # State management
├── hooks/              # Custom React hooks
├── services/           # Business logic
├── api/                # API handlers
├── types/              # TypeScript types
└── lib/                # Utilities

automation/            # Notifier scripts
supabase/              # Database & functions
public/                # Static assets
```

---

## Documentation

### Available Commands

```bash
# Development
npm run dev                      # Start dev server
npm run build                   # Build for production
npm run preview                 # Preview production build
npm run lint                    # Run ESLint

# Testing & Diagnostics
npm run test:scraper            # Test static scraper
npm run test:scraper:selenium  # Test Selenium scraper
npm run diagnose:scraper        # Diagnose scraper issues

# Automation
npm run notify:selenium         # Run notifier once
```

### Configuration

- **Court Settings**: Edit `src/context/SystemContext.tsx` → `generateMockCourts()`
- **Email Config**: Set environment variables in `.env`
- **Scrape Schedule**: Modify PM2 cron pattern
- **Refresh Interval**: Change timeout in `SystemContext.tsx`

---

## Deployment

### Self-Hosted (Recommended)

```bash
# Setup PM2 for auto-restart
npm install -g pm2

# Start services
pm2 start "npm run dev" --name "dashboard"
pm2 start "npm run notify:selenium" --cron "0 */4 * * *" --name "notifier"
pm2 save
pm2 startup
```

### Cloud Deployment

- **Frontend**: Vercel, Netlify, or GitHub Pages
- **Backend**: Heroku, Railway, or DigitalOcean

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No courts displaying | Check if today is January 1st (no events scheduled) |
| Emails not sending | Verify SMTP credentials and Gmail app password |
| Scraper timing out | Increase wait times in scraper config |
| High memory usage | Restart Selenium service periodically |

---

## Performance

| Metric | Value |
|--------|-------|
| Dashboard Load | <1s |
| Scraper Runtime | 30-60s (first), 15-30s (cached) |
| Memory Usage | ~300MB (with Selenium) |
| Auto-refresh | 30s (demo), 5m (production) |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- 📖 [Documentation](#documentation)
- 🐛 [Report Issues](https://github.com/yourusername/BCAANS/issues)
- 💬 [Discussions](https://github.com/yourusername/BCAANS/discussions)

---

<div align="center">

Made with ❤️ for badminton enthusiasts

**[⬆ Back to top](#bcaans---badmintoncourt-availability-automated-notification-system)**

</div>
