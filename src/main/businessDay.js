/**
 * The restaurant's trading day runs 09:00 to 05:00 the next morning, so a
 * business day crosses midnight. An order taken at 01:30 on the 20th belongs to
 * the 19th's takings, not the 20th's.
 *
 * Every date in the app goes through here. Reports group on `business_day`
 * rather than on the wall-clock timestamp, so a late-night sale can never fall
 * into the wrong day's totals.
 */

export const DAY_START_HOUR = 9;   // 09:00 - trading opens
export const DAY_END_HOUR = 5;     // 05:00 next morning - trading closes

/**
 * The business day a moment belongs to, as 'YYYY-MM-DD'.
 *
 *   19 Aug 09:00 .. 20 Aug 04:59  -> 2026-08-19
 *   20 Aug 05:00 .. 20 Aug 08:59  -> 2026-08-20  (dead hours roll forward)
 *   20 Aug 09:00 .. 21 Aug 04:59  -> 2026-08-20
 */
export function businessDayOf(when = new Date()) {
  const d = new Date(when);

  // Before the 05:00 cut-off the shift still belongs to the previous calendar
  // day. From 05:00 onwards - including the closed 05:00-09:00 window - it
  // belongs to the day now beginning.
  if (d.getHours() < DAY_END_HOUR) {
    d.setDate(d.getDate() - 1);
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** True while the restaurant is inside its 09:00-05:00 trading window. */
export function isTradingNow(when = new Date()) {
  const h = new Date(when).getHours();
  return h >= DAY_START_HOUR || h < DAY_END_HOUR;
}

/** Start and end instants of a given business day, for report range queries. */
export function businessDayRange(businessDay) {
  const [y, m, d] = businessDay.split('-').map(Number);

  const start = new Date(y, m - 1, d, DAY_START_HOUR, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, DAY_END_HOUR, 0, 0, 0);
  return { start, end };
}

/** Human label for a business day, e.g. "19 Aug 2026". */
export function formatBusinessDay(businessDay) {
  const [y, m, d] = businessDay.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
