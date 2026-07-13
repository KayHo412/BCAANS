import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { scrapeAvailableCourts, type ScraperResult } from './automation/court-scraper';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const cacheMs = Number(process.env.COURT_CACHE_MS ?? 5 * 60_000);
let cachedResult: ScraperResult | undefined;
let activeScrape: Promise<ScraperResult> | undefined;

async function getCourts(): Promise<ScraperResult> {
  const cacheAge = cachedResult ? Date.now() - Date.parse(cachedResult.lastUpdated) : Infinity;
  if (cachedResult && cacheAge < cacheMs) return cachedResult;
  activeScrape ??= scrapeAvailableCourts().finally(() => { activeScrape = undefined; });
  cachedResult = await activeScrape;
  return cachedResult;
}

app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/courts', async (_req, res) => {
  const result = await getCourts();
  res.status(result.success ? 200 : 502).json(result);
});

app.listen(port, () => console.log(`Court API listening on http://localhost:${port}`));
