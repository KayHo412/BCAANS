import 'dotenv/config';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { scrapeAvailableCourts, type CourtAvailability } from './court-scraper';

type NotificationState = string[];
const stateFile = path.resolve(process.cwd(), 'selenium-notification-state.json');

function recipients(): string[] {
  return (process.env.EMAIL_TO ?? '').split(/[,;]+/).map((email) => email.trim()).filter(Boolean);
}

function validateEnvironment(): void {
  const required = ['EMAIL_FROM', 'EMAIL_TO', 'SMTP_SERVER', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

function stateFor(courts: CourtAvailability[]): NotificationState {
  return courts.map((court) => `${court.date}|${court.time}|${court.courtNumber}`).sort();
}

async function loadState(): Promise<NotificationState> {
  if (!existsSync(stateFile)) return [];
  try {
    return JSON.parse(await readFile(stateFile, 'utf-8')) as NotificationState;
  } catch {
    console.warn('Notification state is invalid; rebuilding it from this scan.');
    return [];
  }
}

async function notify(courts: CourtAvailability[]): Promise<void> {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    bcc: recipients(),
    subject: `[BCAANS] ${courts.length} badminton court${courts.length === 1 ? '' : 's'} available`,
    text: courts.map((court) => `${court.date} — ${court.time} — ${court.courtNumber}\n${court.bookingUrl}`).join('\n\n'),
  });
}

async function runOnce(): Promise<void> {
  validateEnvironment();
  const result = await scrapeAvailableCourts();
  if (!result.success) throw new Error(result.error ?? 'Scrape failed');

  const previous = new Set(await loadState());
  const current = stateFor(result.courts);
  const newCourts = result.courts.filter((court) => !previous.has(`${court.date}|${court.time}|${court.courtNumber}`));
  if (newCourts.length) await notify(newCourts);
  await writeFile(stateFile, JSON.stringify(current, null, 2), 'utf-8');
  console.log(`Scan complete: ${result.courts.length} available, ${newCourts.length} newly available.`);
}

runOnce().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
