import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import * as cheerio from 'cheerio';
import type { CourtAvailability, ScraperResult } from '../types/badminton';

const BASE_URL = 'https://www.tuni.fi/sportuni/omasivu/';
const URLS = [
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=0',
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=1'
];
const SEARCH_TEXTS = [
  '16:00 Badminton', '17:00 Badminton', '17:30 Badminton', '18:00 Badminton',
  '18:30 Badminton', '19:00 Badminton', '19:30 Badminton', '20:00 Badminton',
  '20:30 Badminton', '21:00 Badminton', '21:30 Badminton'
];
const WEEKEND_SLOT_TIMES = new Set(['16:00', '17:00', '18:00']);
const WAIT_FOR_PAGE_MS = 5000;
const REQUEST_DELAY_MS = 2000;

function buildDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox');
  options.addArguments(
    'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  );

  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

function parseCalendar(html: string): Array<{ date: string; eventUrl: string }> {
  const $ = cheerio.load(html);
  const events: Array<{ date: string; eventUrl: string }> = [];
  const listItems = $('ul.ui-listview li');
  let currentDate = '';

  listItems.each((_, element) => {
    const el = $(element);
    if (el.hasClass('ui-li-divider')) {
      currentDate = el.text().trim();
      return;
    }

    const badmintonLink = el.find('a:contains("Sulkapallo")');
    if (badmintonLink.length > 0 && currentDate) {
      const relativeHref = badmintonLink.attr('href');
      if (relativeHref) {
        const absoluteUrl = new URL(relativeHref, BASE_URL).toString();
        events.push({ date: currentDate, eventUrl: absoluteUrl });
      }
    }
  });

  return events;
}

function parseDetail(html: string, date: string): CourtAvailability[] {
  const $ = cheerio.load(html);
  const courts: CourtAvailability[] = [];

  // Look for "Book court 1" through "Book court 6"
  for (let courtNum = 1; courtNum <= 6; courtNum += 1) {
    if (html.includes(`Book court ${courtNum}`)) {
      const courtNumber = `Court ${courtNum}`;
      courts.push({
        date,
        courtNumber,
        bookingUrl: '',
        isAvailable: true
      });
    }
  }

  return courts;
}

export class BadmintonScraperServiceSelenium {
  private static instance: BadmintonScraperServiceSelenium;

  private constructor() {}

  static getInstance(): BadmintonScraperServiceSelenium {
    if (!BadmintonScraperServiceSelenium.instance) {
      BadmintonScraperServiceSelenium.instance = new BadmintonScraperServiceSelenium();
    }
    return BadmintonScraperServiceSelenium.instance;
  }

  async scrapeAvailableCourts(): Promise<ScraperResult> {
    const driver = await buildDriver();

    try {
      console.log('Starting badminton court scraping with Selenium...');
      const allCourts: CourtAvailability[] = [];

      for (const url of URLS) {
        await driver.get(url);
        await driver.wait(until.elementLocated(By.css('body')), 8000);

        for (const searchText of SEARCH_TEXTS) {
          const locator = By.xpath(`//*[contains(text(), "${searchText}")]`);
          const elements = await driver.findElements(locator);

          for (const element of elements) {
            try {
              await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
              await driver.wait(until.elementIsVisible(element), 5000).catch(() => undefined);
              await element.click();

              // Wait for page to load
              await new Promise(resolve => setTimeout(resolve, WAIT_FOR_PAGE_MS));

              // Get page source and check for available courts
              const pageSource = await driver.getPageSource();
              const courts: CourtAvailability[] = [];

              for (let courtNum = 1; courtNum <= 6; courtNum += 1) {
                if (pageSource.includes(`Book court ${courtNum}`)) {
                  courts.push({
                    date: searchText,
                    courtNumber: `Court ${courtNum}`,
                    bookingUrl: await driver.getCurrentUrl(),
                    isAvailable: true
                  });
                }
              }

              if (courts.length > 0) {
                allCourts.push(...courts);
              }

              // Go back
              await driver.navigate().back();
              await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));

            } catch (error) {
              console.error(`Error processing element ${searchText}:`, error);
              try {
                await driver.navigate().back();
              } catch (e) {
                // Ignore back navigation errors
              }
            }
          }
        }
      }

      console.log(`Scraped ${allCourts.length} available courts`);
      return { success: true, courts: allCourts, lastUpdated: new Date() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Scraping failed:', message);
      return { success: false, courts: [], error: message, lastUpdated: new Date() };
    } finally {
      await driver.quit();
    }
  }

  async getAvailableCourts(): Promise<CourtAvailability[]> {
    const result = await this.scrapeAvailableCourts();
    return result.courts;
  }
}

export const badmintonScraperSelenium = BadmintonScraperServiceSelenium.getInstance();
