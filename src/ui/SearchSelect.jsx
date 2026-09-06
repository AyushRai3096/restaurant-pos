import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Dropdown with a search box, matching the filters on the Item On/Off screen.
 *
 * A native <select> cannot carry a text field inside its popup, so this is a
 * button plus an absolutely positioned panel. Long option lists — the category
 * list runs to 21 — become usable by typing rather than scrolling.
 */
export default function SearchSelect({ value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrap = useRef(null);

  // Close when the click lands outside, the usual dropdown behaviour.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const current = options.find((o) => o.value === value);

  return (
    <div className={`ss ${className}`} ref={wrap}>
      <button
        className={`ss-field ${open ? 'open' : ''}`}
        onClick={() => {
          setOpen((v) => !v);
          setQuery('');
        }}
      >
        <span className="ss-value">{current?.label ?? ''}</span>
        <Chevron up={open} />
      </button>

      {open && (
        <div className="ss-panel">
          <input
            className="ss-search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && shown.length) {
                onChange(shown[0].value);
                setOpen(false);
              }
            }}
          />

          <div className="ss-options">
            {shown.length === 0 ? (
              <div className="ss-empty">No matches</div>
            ) : (
              shown.map((o) => (
                <button
                  key={o.value}
                  className={`ss-option ${o.value === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Chevron = ({ up }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d={up ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
  </svg>
);
