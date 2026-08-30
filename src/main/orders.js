import { getDb } from './db';
import { businessDayOf, businessDayRange } from './businessDay';

/**
 * All order operations. Every function here is synchronous because
 * better-sqlite3 is synchronous, and this all runs in the main process.
 */

/** Table grid: every table plus live totals for its running order, if any. */
function listTables() {
  return getDb()
    .prepare(
      `SELECT
         t.id,
         t.name,
         t.status,
         o.id                                  AS order_id,
         o.created_at                          AS order_started_at,
         o.status                              AS order_status,
         COALESCE(SUM(ki.price * ki.qty), 0)   AS amount,
         COALESCE(SUM(ki.qty), 0)              AS item_count,
         (SELECT COUNT(*) FROM kots k2
           WHERE k2.order_id = o.id AND k2.printed_at IS NULL
             AND k2.kot_number > 0) AS unprinted_kots,
         -- kot_number 0 holds saved-but-not-fired items, so it must not count
         -- as a real KOT or the table would show as "Running KOT".
         (SELECT COUNT(*) FROM kots k3
           WHERE k3.order_id = o.id AND k3.kot_number > 0) AS kot_count
       FROM tables t
       LEFT JOIN orders    o  ON o.table_id = t.id AND o.status IN ('running','billed')
       LEFT JOIN kots      k  ON k.order_id = o.id
       LEFT JOIN kot_items ki ON ki.kot_id  = k.id
       GROUP BY t.id
       ORDER BY t.id`
    )
    .all();
}

/** The open order for a table, or null. */
function getOpenOrder(tableId) {
  return (
    getDb()
      .prepare(
        `SELECT * FROM orders
          WHERE table_id = ? AND status IN ('running','billed')
          ORDER BY id DESC LIMIT 1`
      )
      .get(tableId) || null
  );
}

/** Opens an order for a table if none is open. Returns the open order. */
function openOrder(tableId) {
  const db = getDb();
  const existing = getOpenOrder(tableId);
  if (existing) return existing;

  const run = db.transaction(() => {
    // Stamped once, at creation - the order stays with this trading day even
    // if it is settled after the 05:00 rollover.
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO orders (table_id, business_day) VALUES (?, ?)`)
      .run(tableId, businessDayOf());
    db.prepare(`UPDATE tables SET status = 'running' WHERE id = ?`).run(tableId);
    return lastInsertRowid;
  });

  const id = run();
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

/** Full detail for the order screen: every KOT with its items. */
function getOrderDetail(orderId) {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id);

  const kots = db
    .prepare('SELECT * FROM kots WHERE order_id = ? ORDER BY kot_number')
    .all(orderId);

  const itemsByKot = db.prepare('SELECT * FROM kot_items WHERE kot_id = ? ORDER BY id');
  for (const kot of kots) kot.items = itemsByKot.all(kot.id);

  return { order, table, kots, bill: buildBill(orderId) };
}

/**
 * Saves a new KOT for an order.
 * `items` is [{ name, price, qty }] — only the newly added items.
 * Same name+price gets merged into a single row with summed qty.
 */
function addKot(orderId, items) {
  const db = getDb();

  const clean = mergeItems(items);
  if (clean.length === 0) throw new Error('Cannot print an empty KOT.');

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status === 'settled') throw new Error('This order is already settled.');

  const run = db.transaction(() => {
    const next =
      db
        .prepare('SELECT COALESCE(MAX(kot_number), 0) + 1 AS n FROM kots WHERE order_id = ?')
        .get(orderId).n;

    const { lastInsertRowid: kotId } = db
      .prepare('INSERT INTO kots (order_id, kot_number) VALUES (?, ?)')
      .run(orderId, next);

    const insertItem = db.prepare(
      'INSERT INTO kot_items (kot_id, item_name, price, qty) VALUES (?, ?, ?, ?)'
    );
    for (const it of clean) insertItem.run(kotId, it.name, it.price, it.qty);

    // A billed order that gets new items goes back to running.
    if (order.status === 'billed') {
      db.prepare(`UPDATE orders SET status = 'running', billed_at = NULL WHERE id = ?`).run(
        orderId
      );
    }
    return kotId;
  });

  const kotId = run();
  return getKot(kotId);
}

/** One KOT with its items — this is what gets sent to the printer. */
function getKot(kotId) {
  const db = getDb();
  const kot = db.prepare('SELECT * FROM kots WHERE id = ?').get(kotId);
  if (!kot) return null;

  kot.items = db.prepare('SELECT * FROM kot_items WHERE kot_id = ? ORDER BY id').all(kotId);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(kot.order_id);
  kot.table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id);
  return kot;
}

function markKotPrinted(kotId) {
  getDb()
    .prepare(`UPDATE kots SET printed_at = datetime('now','localtime') WHERE id = ?`)
    .run(kotId);
  return getKot(kotId);
}

/**
 * The bill: every kot_item of the order, grouped by name+price.
 * Nothing is stored — the bill is derived, so it can never drift from the KOTs.
 */
function buildBill(orderId) {
  const db = getDb();

  const lines = db
    .prepare(
      `SELECT ki.item_name AS name,
              ki.price     AS price,
              SUM(ki.qty)  AS qty,
              SUM(ki.qty) * ki.price AS amount
         FROM kot_items ki
         JOIN kots k ON k.id = ki.kot_id
        WHERE k.order_id = ?
        GROUP BY ki.item_name, ki.price
        ORDER BY ki.item_name`
    )
    .all(orderId);

  // Menu prices INCLUDE 5% GST, so the taxable value is back-calculated rather
  // than having tax added on top: a 40.00 naan is 38.10 taxable + 1.90 tax.
  //
  // Each line is rounded to paise FIRST and those rounded values are summed.
  // Dividing the gross total instead loses a paisa on this very bill
  // (457.14 vs the 457.15 the printed receipt shows).
  const taxLines = lines.map((l) => ({
    ...l,
    price: round2(l.price / 1.05),
    amount: round2(l.amount / 1.05),
  }));

  const subTotal = round2(taxLines.reduce((sum, l) => sum + l.amount, 0));

  // 2.5% CGST + 2.5% SGST - the standard restaurant split in India.
  const cgst = round2(subTotal * 0.025);
  const sgst = round2(subTotal * 0.025);
  const total = round2(subTotal + cgst + sgst);
  const roundedTotal = Math.round(total);

  return {
    lines: taxLines,
    subTotal,
    cgst,
    sgst,
    total,
    roundedTotal,
    roundOff: round2(roundedTotal - total),
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
  };
}

/**
 * Saves items onto the order without creating a KOT. This is what the plain
 * "Save" button does: the order exists and the table is occupied, but nothing
 * has gone to the kitchen yet - the blue "Running Table" state.
 */
function saveItems(orderId, items) {
  const db = getDb();
  const clean = mergeItems(items);
  if (clean.length === 0) return getOrderDetail(orderId);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status === 'settled') throw new Error('This order is already settled.');

  // Saved-but-unfired items still need a row to hang off, so they go into a
  // KOT with kot_number 0, which the UI treats as "not sent to kitchen".
  const run = db.transaction(() => {
    let holder = db
      .prepare('SELECT * FROM kots WHERE order_id = ? AND kot_number = 0')
      .get(orderId);

    if (!holder) {
      const { lastInsertRowid } = db
        .prepare('INSERT INTO kots (order_id, kot_number) VALUES (?, 0)')
        .run(orderId);
      holder = { id: lastInsertRowid };
    }

    const insertItem = db.prepare(
      'INSERT INTO kot_items (kot_id, item_name, price, qty) VALUES (?, ?, ?, ?)'
    );
    for (const it of clean) insertItem.run(holder.id, it.name, it.price, it.qty);
  });
  run();

  return getOrderDetail(orderId);
}

/**
 * Marks the order billed without producing any print output. Used by
 * "Save & EBill", which puts the table into the bill-printed state directly.
 */
function markBilled(orderId) {
  const db = getDb();
  const bill = buildBill(orderId);
  if (bill.lines.length === 0) throw new Error('Nothing to bill on this table.');

  db.prepare(
    `UPDATE orders SET status = 'billed', billed_at = datetime('now','localtime')
      WHERE id = ? AND status = 'running'`
  ).run(orderId);

  return getOrderDetail(orderId);
}

/** Marks the order billed. The table stays occupied until it is settled. */
function printBill(orderId) {
  const db = getDb();
  const bill = buildBill(orderId);
  if (bill.lines.length === 0) throw new Error('Nothing to bill on this table.');

  db.prepare(
    `UPDATE orders SET status = 'billed', billed_at = datetime('now','localtime')
      WHERE id = ? AND status = 'running'`
  ).run(orderId);

  return getOrderDetail(orderId);
}

/** Settles the order and frees the table. */
function settleOrder(orderId, mode = 'Cash') {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status === 'settled') throw new Error('This order is already settled.');

  const bill = buildBill(orderId);
  if (bill.lines.length === 0) throw new Error('Nothing to settle on this table.');

  const run = db.transaction(() => {
    db.prepare(
      `UPDATE orders SET status = 'settled', settled_at = datetime('now','localtime')
        WHERE id = ?`
    ).run(orderId);
    db.prepare(`UPDATE tables SET status = 'free' WHERE id = ?`).run(order.table_id);
  });
  run();

  return { orderId, tableId: order.table_id, mode, total: bill.roundedTotal };
}

/**
 * Takings for one business day ('YYYY-MM-DD').
 *
 * Settled and still-open orders are reported separately: a manager checking
 * mid-service needs to see money already collected AND money sitting on live
 * tables, without the two being confused.
 */
function daySummary(businessDay = businessDayOf()) {
  const db = getDb();

  const orders = db
    .prepare(
      `SELECT id, status FROM orders
        WHERE business_day = ? AND status IN ('settled','billed','running')`
    )
    .all(businessDay);

  const settled = { count: 0, subTotal: 0, total: 0 };
  const open = { count: 0, subTotal: 0, total: 0 };

  for (const o of orders) {
    const bill = buildBill(o.id);
    if (bill.lines.length === 0) continue;

    const bucket = o.status === 'settled' ? settled : open;
    bucket.count += 1;
    bucket.subTotal += bill.subTotal;
    bucket.total += bill.roundedTotal;
  }

  for (const b of [settled, open]) {
    b.subTotal = round2(b.subTotal);
    b.total = round2(b.total);
  }

  // Item mix across settled orders only - open tables can still change.
  const items = db
    .prepare(
      `SELECT ki.item_name AS name, SUM(ki.qty) AS qty,
              SUM(ki.qty * ki.price) AS amount
         FROM kot_items ki
         JOIN kots   k ON k.id = ki.kot_id
         JOIN orders o ON o.id = k.order_id
        WHERE o.business_day = ? AND o.status = 'settled'
        GROUP BY ki.item_name
        ORDER BY amount DESC`
    )
    .all(businessDay);

  const cgst = round2(settled.subTotal * 0.025);

  return {
    businessDay,
    range: businessDayRange(businessDay),
    settled,
    open,
    // Convenience fields for the headline figures.
    orderCount: settled.count,
    subTotal: settled.subTotal,
    cgst,
    sgst: cgst,
    total: settled.total,
    items: items.map((i) => ({ ...i, amount: round2(i.amount) })),
  };
}

/** Business days that have any orders, newest first - for the date picker. */
function reportDays(limit = 60) {
  return getDb()
    .prepare(
      `SELECT business_day AS day, COUNT(*) AS orders
         FROM orders
        WHERE business_day IS NOT NULL
        GROUP BY business_day
        ORDER BY business_day DESC
        LIMIT ?`
    )
    .all(limit);
}

/* helpers */

function mergeItems(items) {
  const map = new Map();
  for (const raw of items || []) {
    const name = String(raw.name || '').trim();
    const price = Number(raw.price);
    const qty = Math.trunc(Number(raw.qty));
    if (!name || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) continue;

    const key = `${name}::${price}`;
    map.set(key, map.has(key) ? { name, price, qty: map.get(key).qty + qty } : { name, price, qty });
  }
  return [...map.values()];
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export {
  daySummary,
  reportDays,
  saveItems,
  markBilled,
  listTables,
  getOpenOrder,
  openOrder,
  getOrderDetail,
  addKot,
  getKot,
  markKotPrinted,
  buildBill,
  printBill,
  settleOrder,
};
