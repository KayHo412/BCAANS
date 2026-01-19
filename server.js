import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Scraper backend is running' });
});

// Scrape courts endpoint
app.get('/api/scrape', async (req, res) => {
  try {
    console.log('Starting court scraping...');

    // Dynamic import of TypeScript file
    const { badmintonScraperSelenium } = await import('./src/services/badmintonScraperSelenium.ts');
    const result = await badmintonScraperSelenium.scrapeAvailableCourts();

    if (result.success) {
      res.json({
        success: true,
        courts: result.courts,
        lastUpdated: result.lastUpdated,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        courts: [],
      });
    }
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      courts: [],
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend scraper server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Scrape endpoint: http://localhost:${PORT}/api/scrape`);
});
