import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Sales for one business day.
 *
 * A business day runs 09:00 to 05:00 the next morning, so the figures here are
 * grouped by `business_day` rather than by calendar date - a sale rung up at
 * 01:30 belongs to the previous evening's trading.
 *
 * Settled and open takings are kept apart on purpose: money collected and money
 * still sitting on live tables are different things to a manager mid-service.
 */
export default function ReportsScreen({ onClose, push }) {
  const [days, setDays] = useState([]);
  const [day, setDay] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (businessDay) => {
      setLoading(true);
      try {
        const data = businessDay
          ? await window.api.getDayReport(businessDay)
          : await window.api.getTodayReport();
        setReport(data);
        setDay(data.businessDay);
      } catch (err) {
        push(err.message, 'err');
      } finally {
        setLoading(false);
      }
    },
    [push]
  );

  useEffect(() => {
    window.api.getReportDays().then(setDays).catch(() => {});
    load();
  }, [load]);

  const money = (n) => `₹${Number(n || 0).toFixed(2)}`;

  const label = useMemo(() => {
    if (!day) return '';
    const [y, m, d] = day.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [day]);

  const topItems = report?.items ?? [];
  const maxAmount = topItems.length ? topItems[0].amount : 0;

  return (
    <div className="reports">
      <div className="rep-bar">
        <h1 className="page-title">Sales Report</h1>

        <div className="rep-controls">
          <label className="rep-label">Business day</label>
          <input
            type="date"
            className="rep-date"
            value={day || ''}
            onChange={(e) => e.target.value && load(e.target.value)}
          />

          <select
            className="rep-select"
            value={day || ''}
            onChange={(e) => load(e.target.value)}
          >
            {days.length === 0 && <option value="">No trading days yet</option>}
            {days.map((d) => (
              <option key={d.day} value={d.day}>
                {d.day} — {d.orders} order{d.orders === 1 ? '' : 's'}
              </option>
            ))}
          </select>

          <button className="btn-red" onClick={() => load()}>
            Today
          </button>
          <button className="back-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="rep-body">
        {loading && <div className="empty-note">Loading…</div>}

        {!loading && report && (
          <>
            <div className="rep-daylabel">
              {label}
              <span className="rep-window">
                trading 09:00 — 05:00 next morning
              </span>
            </div>

            <div className="rep-cards">
              <div className="rep-card">
                <span className="rc-label">Settled sales</span>
                <span className="rc-value">{money(report.settled?.total)}</span>
                <span className="rc-sub">
                  {report.settled?.count ?? 0} order
                  {report.settled?.count === 1 ? '' : 's'}
                </span>
              </div>

              <div className="rep-card">
                <span className="rc-label">Open tables</span>
                <span className="rc-value">{money(report.open?.total)}</span>
                <span className="rc-sub">
                  {report.open?.count ?? 0} still running
                </span>
              </div>

              <div className="rep-card">
                <span className="rc-label">Taxable value</span>
                <span className="rc-value">{money(report.subTotal)}</span>
                <span className="rc-sub">before GST</span>
              </div>

              <div className="rep-card">
                <span className="rc-label">GST collected</span>
                <span className="rc-value">
                  {money((report.cgst || 0) + (report.sgst || 0))}
                </span>
                <span className="rc-sub">
                  CGST {money(report.cgst)} · SGST {money(report.sgst)}
                </span>
              </div>
            </div>

            <h2 className="rep-heading">
              Items sold
              <span className="rep-note">settled orders only</span>
            </h2>

            {topItems.length === 0 ? (
              <div className="empty-note">Nothing settled on this day yet.</div>
            ) : (
              <table className="rep-table">
                <thead>
                  <tr>
                    <td className="rt-rank">#</td>
                    <td>Item</td>
                    <td className="rt-qty">Qty</td>
                    <td className="rt-amt">Amount</td>
                    <td className="rt-bar" />
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((it, i) => (
                    <tr key={it.name}>
                      <td className="rt-rank">{i + 1}</td>
                      <td>{it.name}</td>
                      <td className="rt-qty">{it.qty}</td>
                      <td className="rt-amt">{money(it.amount)}</td>
                      <td className="rt-bar">
                        <span
                          className="rt-fill"
                          style={{
                            width: maxAmount ? `${(it.amount / maxAmount) * 100}%` : 0,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
