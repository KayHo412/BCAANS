import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import * as cheerio from 'cheerio';
import type { CourtAvailability, ScraperResult } from '../types/badminton';

// Configuration (matching Python code structure)
const URLS = [
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=0',
  'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=1'
];

// Python uses 17:00-21:30 for weekdays, but we also check 16:00 for weekends
const SEARCH_TEXTS = [
  '16:00 Badminton', '16:30 Badminton',
  '17:00 Badminton', '17:30 Badminton', '18:00 Badminton',
  '18:30 Badminton', '19:00 Badminton', '19:30 Badminton',
  '20:00 Badminton', '20:30 Badminton', '21:00 Badminton', '21:30 Badminton'
];

function buildDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox');
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
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
      console.log('Starting badminton court scraping...');
      const allCourts: CourtAvailability[] = [];

      for (const url of URLS) {
        await driver.get(url);
        await driver.wait(until.elementLocated(By.css('body')), 8000);

        for (const searchText of SEARCH_TEXTS) {
          const locator = By.xpath(`//*[contains(text(), "${searchText}")]`);
          const elements = await driver.findElements(locator);

          for (const element of elements) {
            try {
              // Click the time slot element
              element.click();

              // Wait for page to load
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Check for "Book court 1" to "Book court 6" in the page source
              const pageSource = await driver.getPageSource();
              const $ = cheerio.load(pageSource);
              const courtsFound: string[] = [];

              for (let courtNum = 1; courtNum <= 6; courtNum++) {
                if (pageSource.includes(`Book court ${courtNum}`)) {
                  courtsFound.push(`Court ${courtNum}`);
                }
              }

              if (courtsFound.length > 0) {
                // Extract label from <b> tag
                const label = $('b').first().text().trim() || searchText;
                const currentUrl = await driver.getCurrentUrl();

                // Check if it's a weekend day and weekend slot
                const isWeekendDay = label.includes('Sat') || label.includes('Sun');
                const isWeekendSlot = searchText === '16:00 Badminton' || searchText === '16:30 Badminton';

                // Python logic: Include weekend slots ONLY on weekends, exclude weekends for 17:00+ slots
                if ((isWeekendSlot && isWeekendDay) || (!isWeekendDay && !isWeekendSlot)) {
                  console.log(`✓ Found: ${label} - ${courtsFound.join(', ')}`);

                  for (const courtNumber of courtsFound) {
                    allCourts.push({
                      date: label,
                      courtNumber,
                      bookingUrl: currentUrl,
                      isAvailable: true
                    });
                  }
                }
              }

              // Go back to the original page
              await driver.navigate().back();
              await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
              console.error(`Error processing ${searchText}:`, error);
              try {
                await driver.navigate().back();
              } catch (e) {
                // Ignore
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
