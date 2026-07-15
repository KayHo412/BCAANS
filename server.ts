import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { scrapeAvailableCourts } from './automation/court-scraper';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main courts availability endpoint
app.get('/api/courts', async (_req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Scraping courts...`);
    const result = await scrapeAvailableCourts();

    if (!result.success) {
      console.error(`Scrape failed: ${result.error}`);
      return res.status(500).json({
        success: false,
        courts: [],
        error: result.error || 'Scraping failed',
        lastUpdated: result.lastUpdated,
      });
    }

    console.log(
      `[${new Date().toISOString()}] Scrape successful: ${result.courts.length} courts found`
    );

    res.json({
      success: true,
      courts: result.courts,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Server error:`, message);

    res.status(500).json({
      success: false,
      courts: [],
      error: message || 'Internal server error',
      lastUpdated: new Date().toISOString(),
    });
  }
});

// Catch-all 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Badminton court scraper running on http://localhost:${PORT}`);
  console.log(`Endpoint: GET http://localhost:${PORT}/api/courts`);
  console.log(`Health check: GET http://localhost:${PORT}/health`);
});