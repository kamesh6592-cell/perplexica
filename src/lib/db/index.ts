import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const dbPath = path.join(DATA_DIR, './data/db.sqlite');

// Create data directory if it doesn't exist
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sqlite: Database.Database;
let db: any;

try {
  sqlite = new Database(dbPath);
  db = drizzle(sqlite, {
    schema: schema,
  });
} catch (error) {
  // During build time, we might not have access to create the database
  // Create a mock db object for build compatibility
  console.warn('Database initialization failed during build, using mock:', error);
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
