import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/golfs.json');

/**
 * Scrapes golf opening dates from info.golf
 * @returns {Promise<Array>} Array of golf objects with opening dates
 */
async function scrapeGolfs() {
  console.log('\n🏌️  Starting Golf Monitor Scraper...');
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    console.log('📍 Navigating to info.golf...');

    try {
      await page.goto('https://www.info.golf/golf-ouverts-quebec/', {
        waitUntil: 'networkidle0',
        timeout: 40000
      });
    } catch (navError) {
      console.log('⚠️  Navigation warning:', navError.message);
      console.log('📖 Continuing with partial page...');
    }

    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(3000);

    // Wait for common golf listing containers to load
    try {
      await Promise.race([
        page.waitForSelector('[data-golf], .golf-item, .club-card, li', { timeout: 5000 }),
        page.waitForTimeout(5000)
      ]);
    } catch (e) {
      console.log('⚠️  No standard containers found - continuing with what loaded');
    }

    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);

    // Debug info
    const title = $('title').text();
    console.log(`📄 Page title: ${title}`);

    // Log page size
    const bodyText = $.text();
    console.log(`📏 Total text content: ${bodyText.length} characters\n`);

    const golfs = [];

    // Strategy 1: Extract from <table> rows
    console.log('🔍 Strategy 1: Extracting from <table> structure...');

    const tableRows = $('table tbody tr, table tr');
    console.log(`   📊 Found ${tableRows.length} table rows`);

    if (tableRows.length > 0) {
      tableRows.each((idx, row) => {
        if (golfs.length >= 50) return;

        try {
          const $row = $(row);
          const cells = $row.find('td');

          if (cells.length >= 2) {
            // Structure: [status, name, region, date]
            // At least we need name (2nd column) and ideally date (4th column)

            let name = '';
            let region = 'Unknown';
            let openingDate = null;

            // Extract name from 2nd column (if exists)
            if (cells.length >= 2) {
              name = $(cells[1]).text().trim();
            }

            // Extract region from 3rd column (if exists)
            if (cells.length >= 3) {
              region = $(cells[2]).text().trim();
            }

            // Extract date from 4th column (if exists)
            if (cells.length >= 4) {
              const dateCell = $(cells[3]).text().trim();
              // Extract date pattern like "12 avril" or "Ouverture le 12 avril"
              const dateMatch = dateCell.match(/(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i);
              if (dateMatch) {
                openingDate = dateMatch[1];
              }
            }

            // Add golf if we have a valid name
            if (name && name.length > 3 && name.length < 150) {
              const isDuplicate = golfs.some(g => g.name.toLowerCase() === name.toLowerCase());
              if (!isDuplicate) {
                golfs.push({
                  id: `golf_${Date.now()}_${Math.random()}`,
                  name,
                  openingDate: openingDate || 'À déterminer',
                  region,
                  coordinates: null,
                  url: null,
                  scrapedAt: new Date().toISOString()
                });
                console.log(`   ✓ ${name} (${region}) - ${openingDate || 'TBD'}`);
              }
            }
          }
        } catch (error) {
          // Silent continue
        }
      });
    }

    if (golfs.length > 0) {
      console.log(`\n✅ Found ${golfs.length} golfs with strategy 1\n`);
      return golfs;
    }

    // Strategy 2: Look for any <tr> with golf keywords
    if (golfs.length === 0) {
      console.log('\n🔍 Strategy 2: Looking for any rows with golf-related content...');

      const allRows = $('tr');
      console.log(`   📊 Found ${allRows.length} total rows`);

      allRows.each((idx, row) => {
        if (golfs.length >= 50) return;

        try {
          const text = $(row).text();

          // Look for rows containing golf/club and dates
          if ((text.includes('Golf') || text.includes('Club')) &&
              (text.includes('avril') || text.includes('mai') || text.includes('juin'))) {

            const cells = $(row).find('td');
            if (cells.length >= 2) {
              let name = '';

              // Try to find golf name in cells
              for (let i = 0; i < cells.length; i++) {
                const cellText = $(cells[i]).text().trim();
                if ((cellText.includes('Golf') || cellText.includes('Club')) && cellText.length < 100) {
                  name = cellText;
                  break;
                }
              }

              if (name && !golfs.some(g => g.name.toLowerCase() === name.toLowerCase())) {
                const dateMatch = text.match(/(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin))/i);

                golfs.push({
                  id: `golf_${Date.now()}_${Math.random()}`,
                  name,
                  openingDate: dateMatch ? dateMatch[1] : 'À déterminer',
                  region: 'Unknown',
                  coordinates: null,
                  url: null,
                  scrapedAt: new Date().toISOString()
                });
                console.log(`   ✓ ${name}`);
              }
            }
          }
        } catch (error) {
          // Silent continue
        }
      });

      if (golfs.length > 0) {
        console.log(`\n✅ Found ${golfs.length} golfs with strategy 2\n`);
        return golfs;
      }
    }

    // Strategy 3: Text-based fallback
    if (golfs.length === 0) {
      console.log('\n🔍 Strategy 3: Text-based fallback parsing...');
      const lines = bodyText.split('\n').filter(l => l.trim().length > 3);

      for (let i = 0; i < lines.length && golfs.length < 50; i++) {
        const line = lines[i];
        if ((line.includes('Golf') || line.includes('Club')) &&
            (line.includes('avril') || line.includes('mai'))) {

          const nameMatch = line.match(/([A-Z][A-Za-z\s&'.-]*(?:Golf|Club)[A-Za-z\s&'.-]*)/);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            const dateMatch = line.match(/(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin))/i);

            if (!golfs.some(g => g.name.toLowerCase() === name.toLowerCase())) {
              golfs.push({
                id: `golf_${Date.now()}_${Math.random()}`,
                name,
                openingDate: dateMatch ? dateMatch[1] : 'À déterminer',
                region: 'Unknown',
                coordinates: null,
                url: null,
                scrapedAt: new Date().toISOString()
              });
              console.log(`   ✓ ${name}`);
            }
          }
        }
      }

      if (golfs.length > 0) {
        console.log(`\n✅ Found ${golfs.length} golfs with strategy 3\n`);
        return golfs;
      }
    }

    if (golfs.length === 0) {
      console.log('\n⚠️  No golfs found. Possible reasons:');
      console.log('  • Table structure is different from expected');
      console.log('  • Content is loaded after initial page load');
      console.log('  • Site structure has changed');
      console.log('\n💡 For now, using cached data from previous scrapes');
    }

    return golfs;

  } catch (error) {
    console.error('❌ Scraping error:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed\n');
    }
  }
}

/**
 * Generates approximate coordinates for Quebec regions
 */
function getApproximateCoordinates(golfName, region) {
  const regionCoordinates = {
    // Administrative regions of Quebec with their central coordinates
    'Abitibi-Témiscamingue': { lat: 48.7519, lng: -80.7837 },
    'Bas-Saint-Laurent': { lat: 48.5333, lng: -69.0833 },
    'Cantons-de-l\'Est': { lat: 45.3667, lng: -71.9333 },
    'Capitale-Nationale': { lat: 46.8139, lng: -71.2080 },
    'Centre-du-Québec': { lat: 46.2333, lng: -72.6167 },
    'Chaudière-Appalaches': { lat: 46.4833, lng: -70.9167 },
    'Côte-Nord': { lat: 49.2727, lng: -67.1333 },
    'Estrie': { lat: 45.5088, lng: -71.9332 },
    'Gaspésie': { lat: 49.0104, lng: -66.6017 },
    'Gaspésie–Îles-de-la-Madeleine': { lat: 49.0104, lng: -66.6017 },
    'Îles-de-la-Madeleine': { lat: 47.4167, lng: -61.8167 },
    'Lanaudière': { lat: 46.2333, lng: -73.2167 },
    'Laurentides': { lat: 46.0088, lng: -74.9847 },
    'Laurentians': { lat: 46.0088, lng: -74.9847 },
    'Laval': { lat: 45.5695, lng: -73.7392 },
    'Mauricie': { lat: 46.3639, lng: -72.5449 },
    'Montérégie': { lat: 45.5333, lng: -73.5167 },
    'Montréal': { lat: 45.5017, lng: -73.5673 },
    'Nord-du-Québec': { lat: 51.9333, lng: -70.5000 },
    'Outaouais': { lat: 45.4215, lng: -75.6972 },
    'Quebec': { lat: 46.8139, lng: -71.2080 },
    'Québec': { lat: 46.8139, lng: -71.2080 },
    'Quebec City': { lat: 46.8139, lng: -71.2080 },
    'Ville-Marie': { lat: 45.5017, lng: -73.5673 },
    'Unknown': { lat: 46.8139, lng: -71.2080 }
  };

  return regionCoordinates[region] || regionCoordinates['Unknown'];
}

/**
 * Saves golfs to JSON file
 */
function saveGolfs(golfs) {
  try {
    // Add coordinates
    const golfsWithCoords = golfs.map(golf => ({
      ...golf,
      coordinates: getApproximateCoordinates(golf.name, golf.region)
    }));

    fs.writeFileSync(DATA_FILE, JSON.stringify(golfsWithCoords, null, 2));
    console.log(`💾 Saved ${golfsWithCoords.length} golfs to data file`);
    return golfsWithCoords;
  } catch (error) {
    console.error('Error saving golfs:', error.message);
    return golfs;
  }
}

/**
 * Loads golfs from JSON file
 */
export function loadGolfs() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading golfs:', error.message);
  }
  return [];
}

/**
 * Main scrape and save function
 */
export async function scrapeAndSave() {
  const golfs = await scrapeGolfs();
  if (golfs.length > 0) {
    return saveGolfs(golfs);
  }
  console.log('📂 No new golfs scraped, keeping existing data');
  return loadGolfs();
}

// Run scraper if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeAndSave()
    .then((golfs) => {
      console.log(`\n✅ Scrape complete: ${golfs.length} golfs total`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Scrape failed:', error);
      process.exit(1);
    });
}
