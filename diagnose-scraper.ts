import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Diagnostic tool to inspect the actual HTML structure of SportUni website
 * Run with: npx tsx diagnose-scraper.ts
 */

const BASE_URL = 'https://www.tuni.fi/sportuni/omasivu/';
const CALENDAR_URL = `${BASE_URL}?page=home&lang=en`;

async function diagnoseScraper() {
  console.log('🔍 Starting diagnostic analysis...\n');

  try {
    // Fetch the calendar page
    console.log(`Fetching: ${CALENDAR_URL}`);
    const response = await axios.get(CALENDAR_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    // Test 1: Check for list views
    console.log('\n--- Test 1: Looking for list views ---');
    const listviews = $('ul.ui-listview');
    console.log(`Found ${listviews.length} ul.ui-listview elements`);

    if (listviews.length === 0) {
      console.log('❌ No ul.ui-listview found. Looking for alternatives...');
      const allUls = $('ul');
      console.log(`Found ${allUls.length} total <ul> elements`);
      allUls.slice(0, 3).each((i, el) => {
        console.log(`  ul[${i}] classes:`, $(el).attr('class'));
      });
    }

    // Test 2: Check for date dividers
    console.log('\n--- Test 2: Looking for date dividers ---');
    const dividers = $('.ui-li-divider');
    console.log(`Found ${dividers.length} elements with class ui-li-divider`);

    if (dividers.length > 0) {
      console.log('Sample dates:');
      dividers.slice(0, 3).each((i, el) => {
        console.log(`  ${i + 1}. ${$(el).text().trim()}`);
      });
    } else {
      console.log('❌ No ui-li-divider found. Looking for all list items...');
      const listItems = $('li');
      console.log(`Found ${listItems.length} total <li> elements`);
      listItems.slice(0, 5).each((i, el) => {
        const text = $(el).text().trim().substring(0, 50);
        const classes = $(el).attr('class');
        console.log(`  li[${i}] class="${classes}": ${text}`);
      });
    }

    // Test 3: Check for Sulkapallo (Badminton) links
    console.log('\n--- Test 3: Looking for Sulkapallo (Badminton) events ---');
    const sulkapalloLinks = $('a:contains("Sulkapallo")');
    console.log(`Found ${sulkapalloLinks.length} links containing "Sulkapallo"`);

    if (sulkapalloLinks.length > 0) {
      console.log('Sample Sulkapallo links:');
      sulkapalloLinks.slice(0, 3).each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        console.log(`  ${i + 1}. "${text}" -> ${href}`);
      });
    } else {
      console.log('❌ No "Sulkapallo" links found. Looking for all event links...');
      const allLinks = $('a');
      console.log(`Found ${allLinks.length} total <a> elements`);

      // Look for any links that might be events
      let eventCount = 0;
      allLinks.each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 0 && text.length < 100 && !text.includes('http')) {
          if (eventCount < 10) {
            const href = $(el).attr('href');
            console.log(`  ${i}. "${text}"`);
            eventCount++;
          }
        }
      });
    }

    // Test 4: Check for dialog content
    console.log('\n--- Test 4: Looking for dialog content ---');
    const dialogContent = $('div.ups-dialog-content');
    console.log(`Found ${dialogContent.length} div.ups-dialog-content elements`);

    if (dialogContent.length === 0) {
      console.log('❌ No ups-dialog-content found. Looking for alternatives...');
      const divs = $('div');
      console.log(`Found ${divs.length} total <div> elements`);

      // Look for divs with class containing "dialog" or "content"
      let foundDialog = false;
      divs.each((i, el) => {
        const classes = $(el).attr('class') || '';
        if (classes.includes('dialog') || classes.includes('content')) {
          console.log(`  Found: class="${classes}"`);
          foundDialog = true;
        }
      });

      if (!foundDialog) {
        console.log('  No divs with "dialog" or "content" in class');
      }
    }

    // Test 5: HTML sample
    console.log('\n--- Test 5: HTML Sample (first 1500 chars) ---');
    const htmlSample = response.data.substring(0, 1500);
    console.log(htmlSample);
    console.log('...');

    console.log('\n✅ Diagnostic complete!');
    console.log('\n📋 Summary:');
    console.log('- If no elements were found, the website structure may have changed');
    console.log('- Check the HTML sample above to see the actual structure');
    console.log('- Update selectors in badmintonScraper.ts if needed');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error instanceof Error ? error.message : error);
  }
}

diagnoseScraper();
