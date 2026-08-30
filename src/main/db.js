import path from 'node:path';
import Database from 'better-sqlite3';
import { app } from 'electron';

let db;

/**
 * Last-resort menu, used only if assets/menu.csv is missing from the build AND
 * the user data folder has no menu.csv either. The real menu is the CSV — see
 * menu.js — so this exists purely so the counter is never left with nothing.
 */
const MENU = [
  { category: 'Steam Momos', name: 'Veg Momos', price: 140 },
  { category: 'Steam Momos', name: 'Paneer Momos', price: 150 },
  { category: 'Breads(Roti)', name: 'Tandoori Roti', price: 20 },
  { category: 'Breads(Roti)', name: 'Butter Naan', price: 40 },
  { category: 'Beverages', name: 'Water Bottle', price: 20 },
];

const TABLE_COUNT = 30;

function init() {
  const file = path.join(app.getPath('userData'), 'petpooja.db');
  db = new Database(file);

  // WAL: reads can happen while a write is in progress. Standard for desktop.
  db.pragma('journal_mode = WAL');
  // SQLite ignores foreign keys unless switched on, per connection.
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id     INTEGER PRIMARY KEY,
      name   TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free','running'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id           INTEGER PRIMARY KEY,
      table_id     INTEGER NOT NULL REFERENCES tables(id),
      status       TEXT NOT NULL DEFAULT 'running'
                   CHECK (status IN ('running','billed','settled')),
      -- The 09:00-05:00 trading day this order belongs to, stamped once at
      -- creation. Reports group on this, never on created_at, so orders taken
      -- after midnight stay with the evening they were part of.
      business_day TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      billed_at    TEXT,
      settled_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS kots (
      id         INTEGER PRIMARY KEY,
      order_id   INTEGER NOT NULL REFERENCES orders(id),
      kot_number INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      printed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS kot_items (
      id        INTEGER PRIMARY KEY,
      kot_id    INTEGER NOT NULL REFERENCES kots(id) ON DELETE CASCADE,
      item_name TEXT    NOT NULL,
      price     REAL    NOT NULL,
      qty       INTEGER NOT NULL CHECK (qty > 0)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id, status);
    CREATE INDEX IF NOT EXISTS idx_kots_order   ON kots(order_id);
    CREATE INDEX IF NOT EXISTS idx_kotitems_kot ON kot_items(kot_id);
  `);

  migrate();
  seedTables();
  return db;
}

/**
 * Adds columns that were introduced after a database was first created.
 * CREATE TABLE IF NOT EXISTS silently skips an existing table, so new columns
 * have to be applied separately.
 */
function migrate() {
  const cols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);

  if (!cols.includes('business_day')) {
    db.exec('ALTER TABLE orders ADD COLUMN business_day TEXT');
    // Backfill from created_at using the same 05:00 cut-off the app applies.
    db.exec(`
      UPDATE orders
         SET business_day = date(datetime(created_at, '-5 hours'))
       WHERE business_day IS NULL
    `);
  }

  // Safe once the column is guaranteed to exist, whether it was just added or
  // came from a fresh CREATE TABLE.
  db.exec('CREATE INDEX IF NOT EXISTS idx_orders_bday ON orders(business_day)');
}

function seedTables() {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM tables').get().n;
  if (existing >= TABLE_COUNT) return;

  const insert = db.prepare('INSERT OR IGNORE INTO tables (name) VALUES (?)');
  const seed = db.transaction(() => {
    for (let i = 1; i <= TABLE_COUNT; i++) insert.run(`T${i}`);
  });
  seed();
}

function getDb() {
  if (!db) throw new Error('Database not initialised. Call init() first.');
  return db;
}

export { init, getDb, MENU, TABLE_COUNT };
