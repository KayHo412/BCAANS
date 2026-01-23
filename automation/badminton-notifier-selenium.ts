import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
// @ts-ignore
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
// @ts-ignore
import chrome from 'selenium-webdriver/chrome';
// @ts-ignore
import nodemailer from 'nodemailer';
import * as cheerio from 'cheerio';

interface Config {
  urls: string[];
  searchTexts: string[];
  weekendSlotTimes: Set<string>;
  stateFile: string;
  emailFrom: string;
  emailTo: string[];
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

interface SlotHit {
  url: string;
  label: string;
  searchText: string;
  courts: string[];
  isWeekendDay: boolean;
  isWeekendSlot: boolean;
  weekLabel: 'This week' | 'Next week' | 'Future week';
}

type NotificationState = Record<string, string[]>;

type Transporter = ReturnType<typeof nodemailer.createTransport>;

const DEFAULT_URLS = [
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=0',
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=1'
];

const DEFAULT_SEARCH_TEXTS = [
  '16:00 Badminton',
  '16:30 Badminton',
  '17:00 Badminton',
  '17:30 Badminton',
  '18:00 Badminton',
  '18:30 Badminton',
  '19:00 Badminton',
  '19:30 Badminton',
  '20:00 Badminton',
  '20:30 Badminton',
  '21:00 Badminton',
  '21:30 Badminton'
];

const WEEKEND_SLOT_TIMES = new Set(['16:00', '16:30', '17:00', '18:00']);
const STATE_FILE = path.resolve(process.cwd(), 'selenium-notification-state.json');
const WAIT_FOR_PAGE_MS = 12000; // Increased to 12 seconds for slow websites
const ELEMENT_WAIT_MS = 8000;   // Wait for element interactions
const NAV_WAIT_MS = 8000;       // Wait after navigation
const GLOBAL_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes global timeout (safety net)

function loadConfig(): Config {
  const emailFrom = process.env.EMAIL_FROM ?? '';
  const emailToRaw = process.env.EMAIL_TO ?? '';
  const smtpHost = process.env.SMTP_SERVER ?? '';
  const smtpPort = Number(process.env.SMTP_PORT ?? '0');
  const smtpUser = process.env.SMTP_USER ?? '';
  const smtpPass = process.env.SMTP_PASS ?? '';

  const emailTo = emailToRaw
    .split(/[,;]+/)
    .map(part => part.trim())
    .filter(Boolean);

  const missing: string[] = [];
  if (!emailFrom) missing.push('EMAIL_FROM');
  if (!emailTo.length) missing.push('EMAIL_TO');
  if (!smtpHost) missing.push('SMTP_SERVER');
  if (!smtpPort) missing.push('SMTP_PORT');
  if (!smtpUser) missing.push('SMTP_USER');
  if (!smtpPass) missing.push('SMTP_PASS');

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    urls: DEFAULT_URLS,
    searchTexts: DEFAULT_SEARCH_TEXTS,
    weekendSlotTimes: WEEKEND_SLOT_TIMES,
    stateFile: STATE_FILE,
    emailFrom,
    emailTo,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass
  };
}

async function loadPreviousState(stateFile: string): Promise<NotificationState> {
  if (!existsSync(stateFile)) return {};

  const raw = await readFile(stateFile, 'utf-8');
  try {
    return JSON.parse(raw) as NotificationState;
  } catch (error) {
    console.warn('State file is invalid JSON, starting fresh.');
    return {};
  }
}

async function saveCurrentState(stateFile: string, state: NotificationState): Promise<void> {
  const normalized = normalizeState(state);
  await writeFile(stateFile, JSON.stringify(normalized, null, 2), 'utf-8');
}

function normalizeState(state: NotificationState): NotificationState {
  const normalized: NotificationState = {};
  for (const url of Object.keys(state).sort()) {
    normalized[url] = [...state[url]].sort();
  }
  return normalized;
}

function hasContentChanged(current: NotificationState, previous: NotificationState): boolean {
  return JSON.stringify(normalizeState(current)) !== JSON.stringify(normalizeState(previous));
}

async function buildDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  return driver;
}

function extractCourts(pageSource: string): string[] {
  const courts: string[] = [];
  for (let courtNum = 1; courtNum <= 6; courtNum += 1) {
    if (pageSource.includes(`Book court ${courtNum}`)) {
      courts.push(`Court ${courtNum}`);
    }
  }
  return courts;
}

function resolveLabel(pageSource: string, fallback: string): string {
  const $ = cheerio.load(pageSource);
  const primary = $('b').first().text().trim();
  const heading = $('li[role="heading"]').last().text().trim();
  return primary || heading || fallback;
}

function deriveWeekLabel(url: string): SlotHit['weekLabel'] {
  const week = new URL(url).searchParams.get('week');
  if (week === '0') return 'This week';
  if (week === '1') return 'Next week';
  return 'Future week';
}

async function inspectSlot(
  driver: WebDriver,
  url: string,
  searchText: string,
  locator: By,
  config: Config
): Promise<SlotHit | null> {
  const elements = await driver.findElements(locator);
  if (!elements.length) return null;

  // Re-query after navigation; pick the first occurrence.
  const element = elements[0];
  await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
  await driver.wait(until.elementIsVisible(element), 5000).catch(() => undefined);
  await element.click();

  // Prefer explicit wait over sleeps; look for booking keywords.
  await driver
    .wait(async () => {
      const html = await driver.getPageSource();
      return html.includes('Book court');
    }, ELEMENT_WAIT_MS)
    .catch(() => undefined);

  const detailSource = await driver.getPageSource();
  const courts = extractCourts(detailSource);
  if (!courts.length) {
    return null;
  }

  const label = resolveLabel(detailSource, searchText);
  const isWeekendDay = /(Sat|Sun)/i.test(label);
  const timeText = searchText.split(' ')[0];
  const isWeekendSlot = config.weekendSlotTimes.has(timeText);

  // Weekend filter: keep only weekend-whitelisted times on weekend days; allow all on weekdays.
  if (isWeekendDay && !isWeekendSlot) {
    return null;
  }

  return {
    url,
    label,
    searchText,
    courts,
    isWeekendDay,
    isWeekendSlot,
    weekLabel: deriveWeekLabel(url)
  };
}

async function scrape(config: Config): Promise<SlotHit[]> {
  const driver = await buildDriver();
  const hits: SlotHit[] = [];
  const startTime = Date.now();

  try {
    for (const url of config.urls) {
      // Check global timeout
      if (Date.now() - startTime > GLOBAL_TIMEOUT_MS) {
        console.warn('Global timeout reached, stopping scrape');
        break;
      }

      console.log(`Scraping URL: ${url}`);
      await driver.get(url);
      await driver.wait(until.elementLocated(By.css('body')), WAIT_FOR_PAGE_MS);

      for (const searchText of config.searchTexts) {
        const locator = By.xpath(`//*[contains(normalize-space(.), "${searchText}")]`);
        const elements = await driver.findElements(locator);
        if (!elements.length) continue;

        // Only process the first occurrence of each search text on each page
        const hit = await inspectSlot(driver, url, searchText, locator, config);
        if (hit) {
          hits.push(hit);
        }

        await driver.navigate().back();
        await driver.wait(until.elementLocated(By.css('body')), NAV_WAIT_MS).catch(() => undefined);
      }
    }
  } finally {
    await driver.quit();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Scrape completed in ${elapsed}s, found ${hits.length} slots`);
  return hits;
}

function buildNotificationState(hits: SlotHit[]): NotificationState {
  const state: NotificationState = {};
  for (const hit of hits) {
    if (!state[hit.url]) {
      state[hit.url] = [];
    }
    state[hit.url].push(`${hit.label} - ${hit.courts.join(', ')}`);
  }
  return normalizeState(state);
}

function formatEmailBody(hits: SlotHit[]): string {
  const lines: string[] = ['New schedule found:', ''];
  const byWeek: Record<string, SlotHit[]> = {};

  for (const hit of hits) {
    if (!byWeek[hit.weekLabel]) {
      byWeek[hit.weekLabel] = [];
    }
    byWeek[hit.weekLabel].push(hit);
  }

  for (const weekLabel of Object.keys(byWeek)) {
    lines.push(`${weekLabel}:`);
    for (const hit of byWeek[weekLabel]) {
      lines.push(`- ${hit.label} - ${hit.courts.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function buildTransporter(config: Config): Transporter {
  const secure = config.smtpPort === 465;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });
}

async function notify(config: Config, hits: SlotHit[]): Promise<void> {
  if (!hits.length) {
    console.log('No schedules to notify.');
    return;
  }

  const transporter = buildTransporter(config);

  const message = {
    from: config.emailFrom,
    bcc: config.emailTo,
    subject: '[Auto] New badminton schedule available',
    text: formatEmailBody(hits)
  };

  await transporter.sendMail(message);
  console.log('Notification sent successfully.');
}

async function runOnce(): Promise<void> {
  const timestamp = new Date().toISOString();
  try {
    const config = loadConfig();
    console.log(`[${timestamp}] Starting court availability scan...`);
    console.log(`[${timestamp}] Loading config: ${config.urls.length} URLs, ${config.searchTexts.length} search texts`);

    const hits = await scrape(config);
    console.log(`[${timestamp}] Scrape returned ${hits.length} hits`);

    const currentState = buildNotificationState(hits);
    const previousState = await loadPreviousState(config.stateFile);
    console.log(`[${timestamp}] Previous state: ${Object.keys(previousState).length} URLs`);
    console.log(`[${timestamp}] Current state: ${Object.keys(currentState).length} URLs`);

    // Clean up old entries: remove any previous state entries that are no longer available
    const cleanedPreviousState: NotificationState = {};
    for (const [url, slots] of Object.entries(previousState)) {
      // Only keep slots that still exist in current state
      if (currentState[url]) {
        cleanedPreviousState[url] = slots;
      }
    }

    if (!hasContentChanged(currentState, cleanedPreviousState)) {
      console.log(`[${timestamp}] No new schedule found or content has not changed.`);
      // Still save the cleaned state to remove stale entries
      await saveCurrentState(config.stateFile, currentState);
      return;
    }

    console.log(`[${timestamp}] Found ${hits.length} new available slots!`);
    await notify(config, hits);
    await saveCurrentState(config.stateFile, currentState);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${timestamp}] Error during scrape: ${errorMsg}`);
    console.error(`[${timestamp}] Stack trace:`, error instanceof Error ? error.stack : 'N/A');
  }
}

async function main(): Promise<void> {
  console.log('[' + new Date().toISOString() + '] Starting badminton notifier with 5-minute interval...');

  // Run immediately on start
  await runOnce();

  // Then run every 5 minutes (avoid concurrent runs)
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  setInterval(() => {
    runOnce();
  }, INTERVAL_MS);
}

main().catch(error => {
  console.error('Fatal error in main:', error);
  process.exit(1);
});
