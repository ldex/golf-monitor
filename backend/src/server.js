import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { scrapeAndSave, loadGolfs } from './scraper.js';
import { sendNotification } from './notifications.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));

// Set UTF-8 charset for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Store last scrape results for comparison
let lastGolfs = [];

/**
 * Initialize data from file on startup
 */
async function initializeData() {
  lastGolfs = loadGolfs();
  console.log(`Initialized with ${lastGolfs.length} golfs`);
}

/**
 * Perform scrape and send notifications
 */
async function performScrape() {
  console.log(`[${new Date().toISOString()}] Running scheduled scrape...`);

  try {
    const newGolfs = await scrapeAndSave();

    // Find newly added golfs
    const newIds = new Set(newGolfs.map(g => g.id));
    const oldIds = new Set(lastGolfs.map(g => g.id));
    const addedGolfs = newGolfs.filter(g => !oldIds.has(g.id));

    lastGolfs = newGolfs;

    if (addedGolfs.length > 0) {
      console.log(`Found ${addedGolfs.length} new golfs`);
      if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
        await sendNotification(addedGolfs);
      }
    }
  } catch (error) {
    console.error('Scrape error:', error.message);
  }
}

// ================== API Routes ==================

/**
 * GET /api/golfs
 * Returns all golf opening dates
 * Query params: sort (date|name|region), filter (region)
 */
app.get('/api/golfs', (req, res) => {
  try {
    let golfs = [...lastGolfs];

    // Apply filters
    if (req.query.filter) {
      golfs = golfs.filter(g =>
        g.region.toLowerCase().includes(req.query.filter.toLowerCase())
      );
    }

    // Apply sorting
    const sortBy = req.query.sort || 'date';
    if (sortBy === 'date') {
      golfs.sort((a, b) => {
        // Try to parse dates intelligently
        const parseDate = (str) => {
          if (!str) return new Date(3000, 0, 0); // Push nulls to end
          // Handle "15 avril" or "April 15" format
          const months = {
            janvier: 0, february: 1, février: 1, march: 2, mars: 2, april: 3, avril: 3,
            may: 4, mai: 4, june: 5, juin: 5, july: 6, juillet: 6, august: 7, août: 7,
            september: 8, septembre: 8, october: 9, octobre: 9, november: 10, novembre: 10,
            december: 11, décembre: 11
          };
          const parts = str.toLowerCase().split(/\s+/);
          const day = parseInt(parts[0]) || 1;
          const monthName = parts[1];
          const month = months[monthName] ?? 0;
          const year = parseInt(parts[2]) || 2026;
          return new Date(year, month, day);
        };
        return parseDate(a.openingDate) - parseDate(b.openingDate);
      });
    } else if (sortBy === 'name') {
      golfs.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'region') {
      golfs.sort((a, b) => a.region.localeCompare(b.region));
    }

    res.json({
      count: golfs.length,
      lastScrapedAt: lastGolfs.length > 0 ? lastGolfs[0].scrapedAt : null,
      data: golfs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/golfs/regions
 * Returns unique regions
 */
app.get('/api/golfs/regions', (req, res) => {
  try {
    const regions = [...new Set(lastGolfs.map(g => g.region))].sort();
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/refresh
 * Manually trigger a scrape
 */
app.post('/api/refresh', async (req, res) => {
  try {
    console.log('Manual refresh triggered');
    await performScrape();
    res.json({
      message: 'Scrape completed',
      count: lastGolfs.length,
      lastScrapedAt: lastGolfs.length > 0 ? lastGolfs[0].scrapedAt : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    golfsCount: lastGolfs.length
  });
});

// ================== Scheduler ==================

/**
 * Schedule scrap every morning at 6 AM
 * Cron format: minute hour day month day-of-week
 *   6 = 6:00 AM
 *   * * * * = every day
 */
cron.schedule('0 6 * * *', () => {
  performScrape();
});

// Also run scrape at startup (after small delay)
setTimeout(() => {
  performScrape();
}, 2000);

// ================== Server Startup ==================

initializeData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Golf Monitor Backend Running         ║
║   Port: ${PORT}                           ║
║   Scheduler: 6 AM daily                ║
║   Data file: backend/data/golfs.json   ║
╚════════════════════════════════════════╝
      `);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize:', error);
    process.exit(1);
  });
