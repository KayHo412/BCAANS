import { badmintonScraperSelenium } from './src/services/badmintonScraperSelenium';

/**
 * Test script for BadmintonScraperService
 * Run with: npx tsx test-scraper.ts
 */

async function runTests() {
  console.log('🏸 Starting Badminton Scraper Tests...\n');

  try {
    // Test 1: Scrape available courts
    console.log('Test 1: Scraping available courts (Selenium)...');
    const result = await badmintonScraperSelenium.scrapeAvailableCourts();

    console.log(`✓ Scraping completed`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Courts found: ${result.courts.length}`);
    console.log(`  Last updated: ${result.lastUpdated}`);

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }

    // Test 2: Display results
    if (result.courts.length > 0) {
      console.log(`\nTest 2: Court Details (first 5):`);
      result.courts.slice(0, 5).forEach((court, index) => {
        console.log(`\n  ${index + 1}. ${court.courtNumber}`);
        console.log(`     Date: ${court.date}`);
        if (court.time) console.log(`     Time: ${court.time}`);
        console.log(`     Available: ${court.isAvailable}`);
        console.log(`     Booking URL: ${court.bookingUrl}`);
      });

      if (result.courts.length > 5) {
        console.log(`\n  ... and ${result.courts.length - 5} more courts`);
      }
    } else {
      console.log('\nTest 2: No courts found');
    }

    // Test 3: Get available courts (direct method)
    console.log(`\n\nTest 3: Testing getAvailableCourts() method...`);
    const courts = await badmintonScraperSelenium.getAvailableCourts();
    console.log(`✓ Retrieved ${courts.length} courts`);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
