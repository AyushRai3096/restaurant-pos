import { useCallback, useEffect, useState } from 'react';
import { IconSearch } from './Icons';
import DatePicker from './DatePicker';

/**
 * Order Report for one business day.
 *
 * A business day runs 09:00 to 05:00 the next morning, so figures are grouped
 * by `business_day` rather than calendar date — a sale at 01:30 belongs to the
 * previous evening's trading.
 *
 * Rows are only rendered for data the app actually records. Payment types that
 * do not exist yet are absent rather than shown as 0.00, which would read as a
 * real figure of zero.
 */
export default function ReportsScreen({ onClose, push }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  // 'from' | 'to' | null - which field the picker is open for
  const [picking, setPicking] = useState(null);

  const load = useCallback(
    async (day) => {
      setLoading(true);
      try {
        const data = day
          ? await window.api.getDayReport(day)
          : await window.api.getTodayReport();
        setReport(data);
        setFrom(data.businessDay);
        setTo(data.businessDay);
      } catch (err) {
        push(err.message, 'err');
      } finally {
        setLoading(false);
      }
    },
    [push]
  );

  useEffect(() => {
    load();
  }, [load]);

  const shiftDay = (days) => {
    const [y, m, d] = (from || '').split('-').map(Number);
    if (!y) return;
    const dt = new Date(y, m - 1, d + days);
    const p = (n) => String(n).padStart(2, '0');
    load(`${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`);
  };

  const money = (n) => Number(n || 0).toFixed(2);

  // The pickers store ISO dates but display them the way the report reads.
  const fmtDate = (v) => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  };

  const heading = (() => {
    if (!report) return '';
    const [y, m, d] = report.businessDay.split('-');
    return `${d}-${m}-${y}`;
  })();

  return (
    <div className="reports">
      {/* No close button - Escape closes the screen, as it does elsewhere. */}
      <div className="rep-title">
        <h1>Order Report</h1>
      </div>

      <div className="rep-toolbar">
        <button className="rep-tool">
          <IconSearch /> Search
        </button>
        <div className="rep-tool-right">
          <button className="rep-chip" onClick={() => shiftDay(-1)}>
            Yesterday Orders
          </button>
          <button className="rep-chip" onClick={() => load()}>
            Today Orders
          </button>
        </div>
      </div>

      <div className="rep-filters">
        <div className="rep-field">
          <span>From</span>
          <button className="rep-date" onClick={() => setPicking('from')}>
            {fmtDate(from)}
          </button>
        </div>
        <div className="rep-field">
          <span>To</span>
          <button className="rep-date" onClick={() => setPicking('to')}>
            {fmtDate(to)}
          </button>
        </div>
        <button className="btn-red rep-search" onClick={() => load(from)}>
          Search
        </button>
      </div>

      {/* Presentation only for now - neither button does anything yet. */}
      <div className="rep-actions">
        <button className="rep-chip">Export Excel</button>
        <button className="rep-chip">Print</button>
      </div>

      <div className="rep-body">
        {loading && <div className="empty-note">Loading…</div>}

        {!loading && report && (
          <>
            <div className="rep-sheet-head">
              <strong>Order Summary Report</strong> - {heading}
            </div>

            <div className="rep-section">Order Status</div>
            <table className="rep-grid">
              <thead>
                <tr>
                  <td>Order Status</td>
                  <td className="num">My Amount (₹)</td>
                  <td className="num">Total (₹)</td>
                  <td className="num">Orders</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Saved:</td>
                  <td className="num">{money(report.status.saved.gross)}</td>
                  <td className="num">{money(report.status.saved.total)}</td>
                  <td className="num">{report.status.saved.count}</td>
                </tr>
                <tr>
                  <td>Printed:</td>
                  <td className="num">{money(report.status.printed.gross)}</td>
                  <td className="num">{money(report.status.printed.total)}</td>
                  <td className="num">{report.status.printed.count}</td>
                </tr>
                {/* The app has no cancel, complimentary or sales-return flow
                    yet, so these are always zero. They are shown so the report
                    reads the same as the one it replaces. */}
                <tr>
                  <td>Cancelled:</td>
                  <td className="num">0.00</td>
                  <td className="num">0.00</td>
                  <td className="num">0</td>
                </tr>
                <tr>
                  <td>Complimentary:</td>
                  <td className="num">0.00</td>
                  <td className="num">0.00</td>
                  <td className="num">0</td>
                </tr>
                <tr>
                  <td>Sales Return:</td>
                  <td className="num">0.00</td>
                  <td className="num">0.00</td>
                  <td className="num">0</td>
                </tr>
                <tr className="total-row-grid">
                  <td>Total:</td>
                  <td className="num">{money(report.grand.gross)}</td>
                  <td className="num">{money(report.grand.total)}</td>
                  <td className="num">{report.grand.count}</td>
                </tr>
              </tbody>
            </table>

            <div className="rep-section">
              Success Orders ({report.settledCount})
            </div>
            {/* Every payment type is listed, so the table always renders -
                rows with no feature behind them simply read 0.00. */}
            <table className="rep-grid">
              <thead>
                <tr>
                  <td>Payment Type</td>
                  <td className="num">Total (₹)</td>
                </tr>
              </thead>
              <tbody>
                {report.payments.map((p) => (
                  <tr key={p.mode}>
                    <td>{p.mode}:</td>
                    <td className="num">{money(p.total)}</td>
                  </tr>
                ))}
                <tr className="total-row-grid">
                  <td>Total:</td>
                  <td className="num">{money(report.settledTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div className="rep-section">Items Sold</div>
            {report.items.length === 0 ? (
              <div className="empty-note">No items settled on this day.</div>
            ) : (
              <table className="rep-grid">
                <thead>
                  <tr>
                    <td>Item</td>
                    <td className="num">Qty</td>
                    <td className="num">Total (₹)</td>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((it) => (
                    <tr key={it.name}>
                      <td>{it.name}</td>
                      <td className="num">{it.qty}</td>
                      <td className="num">{money(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {picking && (
        <DatePicker
          value={picking === 'from' ? from : to}
          onPick={(day) => {
            if (picking === 'from') setFrom(day);
            else setTo(day);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}
