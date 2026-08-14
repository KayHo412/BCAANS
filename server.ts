import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { scrapeAvailableCourts } from './automation/court-scraper';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Email notification endpoint
app.post('/api/notify', async (req, res) => {
  try {
    const { courts } = req.body;

    if (!courts || !Array.isArray(courts) || courts.length === 0) {
      return res.status(400).json({ success: false, error: 'No courts provided' });
    }

    const { SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO } = process.env;
    if (!SMTP_SERVER || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO) {
      return res.status(500).json({
        success: false,
        error: 'Email not configured. Set SMTP_* and EMAIL_* variables in .env',
      });
    }

    const recipients = EMAIL_TO.split(/[,;]+/).map((e: string) => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return res.status(500).json({ success: false, error: 'No recipients configured in EMAIL_TO' });
    }

    const transport = nodemailer.createTransport({
      host: SMTP_SERVER,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const courtList = courts
      .map(
        (c: { date: string; time: string; courtNumber: string; bookingUrl: string }) =>
          `<li><strong>${c.courtNumber}</strong> — ${c.date} ${c.time}<br/><a href="${c.bookingUrl}">Book now</a></li>`
      )
      .join('');

    await transport.sendMail({
      from: EMAIL_FROM,
      bcc: recipients,
      subject: `[CourtWatch] ${courts.length} badminton court${courts.length === 1 ? '' : 's'} available`,
      html: `
        <h2>🏸 Available Courts</h2>
        <ul>${courtList}</ul>
        <p style="color:#888;font-size:12px;">Sent by CourtWatch at ${new Date().toISOString()}</p>
      `,
    });

    console.log(`[${new Date().toISOString()}] Email sent to ${recipients.length} recipient(s)`);
    res.json({ success: true, recipients: recipients.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Email error:`, message);
    res.status(500).json({ success: false, error: message });
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