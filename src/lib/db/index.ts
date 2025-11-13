// Conditional imports - only load SQLite on non-Vercel environments
let drizzle: any, Database: any;
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

if (!process.env.VERCEL && !process.env.NEXT_PHASE) {
  try {
    drizzle = require('drizzle-orm/better-sqlite3').drizzle;
    Database = require('better-sqlite3').default || require('better-sqlite3');
  } catch (error) {
    console.warn('SQLite dependencies not available, using mock database');
  }
}

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const dbPath = path.join(DATA_DIR, './data/db.sqlite');

// Create data directory if it doesn't exist
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sqlite: Database.Database;
let db: any;

// On Vercel, don't try to initialize SQLite at all
if (process.env.VERCEL) {
  console.warn('Running on Vercel, using mock database');
} else {
  try {
    sqlite = new Database(dbPath);
    db = drizzle(sqlite, {
      schema: schema,
    });
  } catch (error) {
    // During build time, we might not have access to create the database
    // Create a mock db object for build compatibility
    console.warn('Database initialization failed during build, using mock:', error);
  }
}

// Create mock db if not initialized
if (!db) {
  db = {
    query: {
      chats: {
        findFirst: () => Promise.resolve(null),
      },
      messages: {
        findFirst: () => Promise.resolve(null),
      },
    },
    insert: () => ({
      values: () => ({
        execute: () => Promise.resolve(),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  };
}

export default db;
