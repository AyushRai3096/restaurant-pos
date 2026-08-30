import { IconPrint, IconEye } from './Icons';

/**
 * The table floor plan.
 *
 * A blank table shows only its number. An occupied one turns a pale colour and
 * shows how long the order has been open, the table number, the running total,
 * and the actions available in that state.
 *
 * State colours follow the legend:
 *   blank   - no order yet, or the order was settled   (grey, dashed)
 *   running - order open but nothing sent to kitchen   (blue)
 *   runkot  - at least one KOT on the order            (yellow)
 *   printed - bill printed, not settled                (green)
 *   paid    - settled but not cleared                  (peach)
 *
 * Blue means "order started, kitchen not involved yet"; yellow means a KOT is
 * running in the kitchen. Keying yellow off an *unprinted* KOT instead would
 * make blue almost unreachable, since a table nearly always has a fresh KOT.
 *
 * "paid" is intentionally unreachable: settling frees the table straight back
 * to blank. The colour stays defined so the legend remains accurate, and so the
 * state is ready if a separate "clear table" step is added later.
 */
function stateOf(t) {
  if (t.order_status === 'billed') return 'printed';
  if (t.order_status === 'running') {
    return t.kot_count > 0 ? 'runkot' : 'running';
  }
  return 'blank';
}

/** Whole minutes since the order was opened. */
function minutesSince(value) {
  if (!value) return 0;
  const started = new Date(String(value).replace(' ', 'T')).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 60000));
}

export default function TableGrid({ tables, onSelect, onPrintBill, onPreview }) {
  return (
    <div className="tables-area">
      <div className="table-grid">
        {tables.map((t) => {
          const state = stateOf(t);
          const num = t.name.replace(/^T/i, '');

          if (state === 'blank') {
            return (
              <button key={t.id} className="table-card blank" onClick={() => onSelect(t)}>
                {num}
              </button>
            );
          }

          // A bill that is already printed only needs reprinting; a running
          // order can also be previewed before it is billed.
          const showEye = state !== 'printed';

          return (
            <div key={t.id} className={`table-card ${state}`} onClick={() => onSelect(t)}>
              <span className="tc-time">{minutesSince(t.order_started_at)} Min</span>
              <span className="tc-no">{num}</span>
              <span className="tc-amt">₹{Number(t.amount).toFixed(2)}</span>

              <div className="tc-actions">
                <button
                  className="tc-act"
                  title="Print bill"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintBill?.(t);
                  }}
                >
                  <IconPrint />
                </button>

                {showEye && (
                  <button
                    className="tc-act"
                    title="View order"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview?.(t);
                    }}
                  >
                    <IconEye />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
