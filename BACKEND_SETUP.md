# Backend Scraper Setup

## Problem
Selenium WebDriver cannot run in the browser (frontend). It's a Node.js library that needs to run on the server.

## Solution: Separate Backend Server

### Architecture:
```
Frontend (React/Vite) → Backend Server (Express) → Selenium Scraper → TUNI Website
     Port 5173              Port 3001
```

## Setup Instructions:

### 1. Install dependencies (if not already installed):
```bash
npm install express cors
```

### 2. Run the backend server:
```bash
npm run server
```

### 3. Run the frontend (in another terminal):
```bash
npm run dev
```

### 4. Or run both together:
```bash
npm install -g concurrently
npm run dev:all
```

### 5. Update the API to call backend:

In `src/api/badminton.ts`, uncomment:
```typescript
const response = await fetch('http://localhost:3001/api/scrape');
const data = await response.json();
return data.courts;
```

## Alternative: Use Your Python Script

You can also keep using your existing Python script as a cron job and store results in Supabase, then have the frontend read from Supabase instead of scraping directly.

## Production Deployment:

For production, you need:
1. Deploy backend server separately (e.g., Railway, Render, Fly.io)
2. Or use Supabase Edge Functions
3. Or run Python script as cron job + store in database
