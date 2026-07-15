import { Builder, By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import * as cheerio from 'cheerio';

export interface CourtAvailability {
  date: string;
  time: string;
  courtNumber: string;
  bookingUrl: string;
  isAvailable: true;
}

export interface ScraperResult {
  success: boolean;
  courts: CourtAvailability[];
  error?: string;
  lastUpdated: string;
}

export const SCRAPE_URLS = [
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=0',
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=1',
] as const;

export const SLOT_TIMES = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'] as const;
export const WEEKEND_SLOT_TIMES = new Set(['16:00', '16:30', '17:00', '18:00']);

const PAGE_WAIT_MS = 12_000;
const DETAIL_WAIT_MS = 15_000;
const MAX_SLOT_ATTEMPTS = 3;

function buildDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1440,1200');
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

export function extractCourts(pageSource: string): string[] {
  return Array.from({ length: 6 }, (_, index) => index + 1)
    .filter((court) => new RegExp(`Book\\s+court\\s+${court}\\b`, 'i').test(pageSource))
    .map((court) => `Court ${court}`);
}

export function resolveLabel(pageSource: string, fallback: string): string {
  const $ = cheerio.load(pageSource);
  return $('b').first().text().trim() || $('li[role="heading"]').last().text().trim() || fallback;
}

export function shouldIncludeSlot(label: string, time: string): boolean {
  return !/(sat|sun)/i.test(label) || WEEKEND_SLOT_TIMES.has(time);
}

function timeRange(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const end = new Date(2000, 0, 1, hours, minutes + 60);
  return `${time} - ${end.toTimeString().slice(0, 5)}`;
}

async function waitForSchedule(driver: WebDriver): Promise<void> {
  await driver.wait(until.elementLocated(By.css('body')), PAGE_WAIT_MS);
  await driver.wait(async () => (await driver.findElements(By.css('a, button, [role="button"], li, td'))).length > 0, PAGE_WAIT_MS);
}

async function findSlot(driver: WebDriver, text: string): Promise<WebElement | undefined> {
  const candidates = await driver.findElements(By.css('a, button, [role="button"], li, td'));
  for (const candidate of candidates) {
    const candidateText = (await candidate.getText()).replace(/\s+/g, ' ').trim();
    if (candidateText === `Badminton ${text}` || candidateText === `${text} Badminton`) return candidate;
  }
  return undefined;
}

async function inspectSlot(driver: WebDriver, scheduleUrl: string, time: string): Promise<CourtAvailability[]> {
  for (let attempt = 1; attempt <= MAX_SLOT_ATTEMPTS; attempt += 1) {
    try {
      // Reloading the known schedule URL avoids brittle browser history and stale elements.
      await driver.get(scheduleUrl);
      await waitForSchedule(driver);
      const slot = await findSlot(driver, time);
      if (!slot) return [];

      await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', slot);
      await driver.wait(until.elementIsVisible(slot), DETAIL_WAIT_MS);
      await driver.executeScript('arguments[0].click();', slot);
      await driver.wait(async () => (await driver.getPageSource()).includes('Book court'), DETAIL_WAIT_MS);

      const source = await driver.getPageSource();
      const courts = extractCourts(source);
      const label = resolveLabel(source, `${time} Badminton`);
      if (!courts.length || !shouldIncludeSlot(label, time)) return [];

      const bookingUrl = await driver.getCurrentUrl();
      return courts.map((courtNumber) => ({
        date: label,
        time: timeRange(time),
        courtNumber,
        bookingUrl,
        isAvailable: true,
      }));
    } catch (error) {
      if (attempt === MAX_SLOT_ATTEMPTS) {
        console.warn(`Could not inspect ${time}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  return [];
}

export async function scrapeAvailableCourts(): Promise<ScraperResult> {
  const driver = await buildDriver();
  const lastUpdated = new Date().toISOString();
  try {
    const courts: CourtAvailability[] = [];
    for (const url of SCRAPE_URLS) {
      for (const time of SLOT_TIMES) courts.push(...await inspectSlot(driver, url, time));
    }
    return { success: true, courts, lastUpdated };
  } catch (error) {
    return { success: false, courts: [], error: error instanceof Error ? error.message : String(error), lastUpdated };
  } finally {
    await driver.quit();
  }
}
