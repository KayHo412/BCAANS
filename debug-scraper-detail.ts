import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { writeFileSync } from 'fs';

async function debugScraper() {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    const url = 'https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=0';
    await driver.get(url);
    await driver.wait(until.elementLocated(By.css('body')), 8000);

    // Click on first available time slot
    const searchText = '16:00 Badminton';
    const locator = By.xpath(`//*[contains(text(), "${searchText}")]`);
    const elements = await driver.findElements(locator);

    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with "${searchText}"`);

      const element = elements[0];
      await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
      await element.click();
      await new Promise(resolve => setTimeout(resolve, 5000));

      const pageSource = await driver.getPageSource();

      // Save HTML for inspection
      writeFileSync('debug-page-detail.html', pageSource);
      console.log('✓ Saved HTML to debug-page-detail.html');

      // Check what booking elements exist
      console.log('\n=== Checking for booking elements ===');
      for (let courtNum = 1; courtNum <= 6; courtNum++) {
        // Try different selectors
        const textMatch = pageSource.includes(`Book court ${courtNum}`);
        console.log(`\nCourt ${courtNum}:`);
        console.log(`  - Contains text "Book court ${courtNum}": ${textMatch}`);

        // Try to find actual link
        const linkSelector = By.xpath(`//a[contains(text(), 'Book court ${courtNum}')]`);
        const links = await driver.findElements(linkSelector);
        console.log(`  - Found ${links.length} link elements`);

        if (links.length > 0) {
          const link = links[0];
          const href = await link.getAttribute('href');
          const className = await link.getAttribute('class');
          const isDisplayed = await link.isDisplayed();
          const isEnabled = await link.isEnabled();

          console.log(`  - href: ${href}`);
          console.log(`  - class: ${className}`);
          console.log(`  - isDisplayed: ${isDisplayed}`);
          console.log(`  - isEnabled: ${isEnabled}`);
        }

        // Check for disabled indicators
        const disabledPattern = new RegExp(`(disabled|booked|unavailable).*court\\s*${courtNum}`, 'i');
        const hasDisabledIndicator = disabledPattern.test(pageSource);
        console.log(`  - Has disabled indicator: ${hasDisabledIndicator}`);
      }

      console.log('\n=== Checking page for common availability indicators ===');
      const hasFullyBooked = pageSource.includes('fully booked') || pageSource.includes('Fully booked');
      const hasNoAvailability = pageSource.includes('No availability') || pageSource.includes('no availability');
      const hasAllBooked = pageSource.includes('All courts booked') || pageSource.includes('all courts booked');

      console.log(`- Contains "fully booked": ${hasFullyBooked}`);
      console.log(`- Contains "no availability": ${hasNoAvailability}`);
      console.log(`- Contains "all courts booked": ${hasAllBooked}`);

    } else {
      console.log('No time slot elements found');
    }

  } finally {
    await driver.quit();
  }
}

debugScraper().catch(console.error);
