import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { MENU as BUNDLED_MENU } from './db';
import { assetPath } from './assets';

/**
 * The menu is read from a CSV file that sits beside the database in the app's
 * data folder, not from inside the packaged app. That means a restaurant can
 * change prices by editing one file and restarting - no new build, no reinstall.
 *
 * Expected columns (header row required, order does not matter):
 *
 *   category,name,variant,price
 *   Veer Ji Special Rolls,Achari Chaap Roll,Half,190
 *   Veer Ji Special Rolls,Achari Chaap Roll,Full,280
 *   Steam Momos,Veg Momos,,120
 *
 * One row per price. Rows sharing a category and name become one item with
 * variants; a blank variant means a single flat price.
 *
 * If the file is missing or unreadable the bundled menu is used, so a bad edit
 * can never leave the counter with no menu at all.
 */

const FILE_NAME = 'menu.csv';

export function menuFilePath() {
  return path.join(app.getPath('userData'), FILE_NAME);
}

/** Splits one CSV line, honouring quoted fields that contain commas. */
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // A doubled quote inside a quoted field is a literal quote.
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

/**
 * Parses the CSV into the shape the UI expects:
 *   { category, name, price }                       - single price
 *   { category, name, variants: [{ label, price }] } - Half/Full etc.
 * Categories and items keep the order they appear in the file.
 */
export function parseMenuCsv(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) throw new Error('Menu file has no rows.');

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = {
    category: header.indexOf('category'),
    name: header.indexOf('name'),
    variant: header.indexOf('variant'),
    price: header.indexOf('price'),
  };

  if (col.category < 0 || col.name < 0 || col.price < 0) {
    throw new Error('Menu file needs category, name and price columns.');
  }

  // Keyed by category::name so repeated rows collapse into one item.
  const byKey = new Map();
  const order = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const category = cells[col.category] || '';
    const name = cells[col.name] || '';
    const variant = col.variant >= 0 ? cells[col.variant] || '' : '';
    const price = Number(cells[col.price]);

    if (!category || !name || !Number.isFinite(price) || price < 0) continue;

    const key = `${category}::${name}`;
    if (!byKey.has(key)) {
      byKey.set(key, { category, name, rows: [] });
      order.push(key);
    }
    byKey.get(key).rows.push({ label: variant, price });
  }

  const menu = [];
  for (const key of order) {
    const { category, name, rows } = byKey.get(key);

    // A single unlabelled row is a flat price; anything else is a variant list.
    if (rows.length === 1 && !rows[0].label) {
      menu.push({ category, name, price: rows[0].price });
    } else {
      menu.push({
        category,
        name,
        variants: rows.map((r, i) => ({
          label: r.label || `Option ${i + 1}`,
          price: r.price,
        })),
      });
    }
  }

  if (menu.length === 0) throw new Error('Menu file has no usable rows.');
  return menu;
}

/** Writes the bundled menu out as CSV so there is something to edit. */
export function writeDefaultMenuFile() {
  const rows = ['category,name,variant,price'];

  const quote = (v) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

  for (const item of BUNDLED_MENU) {
    if (item.variants?.length) {
      for (const v of item.variants) {
        rows.push([quote(item.category), quote(item.name), quote(v.label), v.price].join(','));
      }
    } else {
      rows.push([quote(item.category), quote(item.name), '', item.price].join(','));
    }
  }

  fs.writeFileSync(menuFilePath(), rows.join('\n') + '\n', 'utf8');
}

/**
 * Loads the menu. Creates the file from the bundled menu on first run, and
 * falls back to the bundled copy if the file is broken - the counter must
 * never be left without a menu.
 */
export function loadMenu() {
  const file = menuFilePath();

  try {
    if (!fs.existsSync(file)) {
      // Prefer the real menu shipped in assets/; fall back to writing out the
      // small hard-coded list only if that file is missing from the build.
      const bundled = assetPath('menu.csv');
      if (bundled) {
        fs.copyFileSync(bundled, file);
        return { menu: parseMenuCsv(fs.readFileSync(file, 'utf8')), source: 'bundled', file };
      }
      writeDefaultMenuFile();
      return { menu: BUNDLED_MENU, source: 'created', file };
    }

    const menu = parseMenuCsv(fs.readFileSync(file, 'utf8'));
    return { menu, source: 'file', file };
  } catch (err) {
    console.error('[menu] falling back to the bundled menu:', err.message);
    return { menu: BUNDLED_MENU, source: 'fallback', file, error: err.message };
  }
}

/* ---------------------------------------------------------- availability -- */

/**
 * Items switched off are stored by name in the `item_off` table. Anything not
 * listed there is available, so a fresh install has every item on without
 * needing a row per item.
 */
export function offItems(db) {
  return new Set(db.prepare('SELECT item_name FROM item_off').all().map((r) => r.item_name));
}

export function setItemOff(db, itemName, off) {
  if (off) {
    db.prepare('INSERT OR IGNORE INTO item_off (item_name) VALUES (?)').run(itemName);
  } else {
    db.prepare('DELETE FROM item_off WHERE item_name = ?').run(itemName);
  }
}

/** Switches every item in a category on or off in one go. */
export function setCategoryOff(db, category, off, menu) {
  const names = menu.filter((m) => m.category === category).map((m) => m.name);
  const run = db.transaction(() => {
    for (const name of names) setItemOff(db, name, off);
  });
  run();
}
