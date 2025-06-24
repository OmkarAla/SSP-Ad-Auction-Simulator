// backend/src/db.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDB() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  try {
    console.log('Initializing database'); // Debug log
    await db.exec(`
      CREATE TABLE IF NOT EXISTS dsps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targeting_rules TEXT NOT NULL,
        base_bid_price REAL NOT NULL DEFAULT 0.0,
        ad_creative_image_url TEXT NOT NULL,
        ad_creative_click_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ad_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        publisher_id TEXT NOT NULL,
        ad_slot_id TEXT NOT NULL,
        geo TEXT NOT NULL,
        device TEXT NOT NULL,
        request_time TEXT NOT NULL,
        winner_dsp_id TEXT,
        winning_bid_price REAL,
        status TEXT NOT NULL,
        FOREIGN KEY (winner_dsp_id) REFERENCES dsps(id)
      );
    `);

    const dsps = [
      {
        id: 'DSP_A',
        name: 'Demand Platform A',
        targeting_rules: JSON.stringify({ geo: 'US', device: 'mobile' }),
        base_bid_price: 3.5,
        ad_creative_image_url: 'https://example.com/ad_a.jpg',
        ad_creative_click_url: 'https://example.com/landing_a'
      },
      {
        id: 'DSP_B',
        name: 'Demand Platform B',
        targeting_rules: JSON.stringify({ geo: 'US', device: 'desktop' }),
        base_bid_price: 2.5,
        ad_creative_image_url: 'https://example.com/ad_b.jpg',
        ad_creative_click_url: 'https://example.com/landing_b'
      },
      {
        id: 'DSP_C',
        name: 'Demand Platform C',
        targeting_rules: JSON.stringify({ geo: 'EU', device: 'mobile' }),
        base_bid_price: 2.0,
        ad_creative_image_url: 'https://example.com/ad_c.jpg',
        ad_creative_click_url: 'https://example.com/landing_c'
      }
    ];

    for (const dsp of dsps) {
      await db.run(
        'INSERT OR IGNORE INTO dsps VALUES (?, ?, ?, ?, ?, ?)',
        Object.values(dsp)
      );
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}