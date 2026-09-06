import { useState } from 'react';

/**
 * Date picker modal.
 *
 * Replaces the browser's native date input, which cannot be styled and looks
 * different on every platform. Laid out like the one in the POS being matched:
 * a dark "Date" header, month navigation, a 6-week grid with days from the
 * neighbouring months greyed, and a full-width Close bar.
 */
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const iso = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function DatePicker({ value, onPick, onClose }) {
  const selected = value ? new Date(`${value}T00:00:00`) : new Date();
  const [view, setView] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  const year = view.getFullYear();
  const month = view.getMonth();

  // Always six rows, starting from the Sunday on or before the 1st, so the
  // grid height never jumps between months.
  const start = new Date(year, month, 1);
  start.setDate(start.getDate() - start.getDay());

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const shiftMonth = (by) => setView(new Date(year, month + by, 1));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="datepick" onClick={(e) => e.stopPropagation()}>
        <div className="dp-head">Date</div>

        <div className="dp-month">
          <button className="dp-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <Chevron dir="left" />
          </button>
          <span className="dp-monthname">
            {MONTHS[month]} {year}
          </span>
          <button className="dp-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
            <Chevron dir="right" />
          </button>
        </div>

        <div className="dp-grid">
          {DAYS.map((d) => (
            <span className="dp-dayname" key={d}>{d}</span>
          ))}

          {cells.map((d) => {
            const outside = d.getMonth() !== month;
            const isSelected = iso(d) === value;
            return (
              <button
                key={iso(d)}
                className={`dp-day ${outside ? 'outside' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => onPick(iso(d))}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <button className="dp-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
);
