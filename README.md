# BCAANS

Badminton availability dashboard and email notifier for SportUni Hervanta.

## What is implemented

The Node/Selenium service is the only court-data source. It scrapes the two configured
SportUni weeks, caches a scan for five minutes, and serves the dashboard at
`GET /api/courts`. The optional notifier runs the same shared scraper once and sends
email only for availability that was not present in its previous scan.

Supabase is used by the web app for authentication and profile preferences. It does not
scrape courts or send availability email.

## Run locally

Requirements: Node.js 20+ and Chrome/Chromium.

```bash
npm install
copy .env.example .env
# set the Supabase VITE_* values if you want sign-in, and SMTP values for notifications
npm run dev:all
```

This starts the Vite dashboard on http://localhost:8080 and the Court API on
http://localhost:3001. Vite proxies `/api` to the API server in development.

Useful commands:

```bash
npm run build          # production frontend build
npm run lint           # lint source
npm run test:scraper   # parser and weekend-rule tests
npm run notify:selenium # one scan and email notification run
```

## Configuration

`PORT` controls the API port (default `3001`). `COURT_CACHE_MS` controls the API
cache duration (default five minutes). The notifier needs `EMAIL_FROM`, `EMAIL_TO`,
`SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`.

The notifier state file is generated locally and is intentionally ignored by Git.

## Run on GitHub Actions

The included workflow, [scraper-cron.yml](.github/workflows/scraper-cron.yml), runs one
scan every 15 minutes and can also be started manually from the repository's **Actions**
tab. Add these repository secrets in **Settings → Secrets and variables → Actions**:

- `SMTP_SERVER`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_TO`

The workflow saves its notification state as a private Actions artifact, so a later run
does not re-email courts that are already known. Do not add these values to the workflow
file or commit them to Git.

## Limitations

Scraping depends on the upstream SportUni page structure and a working local Chrome
installation. A failed scrape is returned by the API as an error; the dashboard does not
invent court availability. The notifier is a one-shot command, so schedule it with your
own scheduler (for example Windows Task Scheduler, cron, PM2, or GitHub Actions).
GitHub Actions schedules are not a guaranteed real-time or 24/7 service: runs can start
late, and scheduled workflows can be disabled for inactive public repositories.
