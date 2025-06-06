import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in production (Vercel) or development
const isProduction = process.env.NODE_ENV === 'production';

// Create database connection
const db = new sqlite3.Database(
  isProduction ? ':memory:' : join(__dirname, '../database.sqlite'),
  (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
    } else {
      console.log('Connected to SQLite database');
      createTables();
    }
  }
);

// Create necessary tables
function createTables() {
  db.serialize(() => {
    // Drop existing tables to recreate with new schema
    db.run(`DROP TABLE IF EXISTS reference_images`);
    db.run(`DROP TABLE IF EXISTS drawings`);
    db.run(`DROP TABLE IF EXISTS slides`);

    // Table for storing slides
    db.run(`
      CREATE TABLE IF NOT EXISTS slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slide_id TEXT NOT NULL UNIQUE,
        title TEXT,
        countdown_time INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table for storing drawing submissions
    db.run(`
      CREATE TABLE IF NOT EXISTS drawings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slide_id TEXT NOT NULL,
        audience_id TEXT NOT NULL,
        audience_name TEXT NOT NULL,
        image_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (slide_id) REFERENCES slides(slide_id)
      )
    `);

    // Table for storing reference images
    db.run(`
      CREATE TABLE IF NOT EXISTS reference_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slide_id TEXT NOT NULL UNIQUE,
        image_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (slide_id) REFERENCES slides(slide_id)
      )
    `);

    console.log('Database tables created successfully');
  });
}

export default db; 