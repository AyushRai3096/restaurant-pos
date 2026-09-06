/**
 * Store on/off drawer.
 *
 * Slides in from the right over a dimmed page, listing each delivery platform
 * with an Off/On segmented switch. Presentation only for now — flipping a
 * switch changes local state and nothing else, since there is no aggregator
 * integration behind it.
 */
import { useState } from 'react';
import { platformLogo } from './platformLogos';

const PLATFORMS = [
  { key: 'zomato', name: 'Zomato', tint: '#e23744' },
  { key: 'swiggy', name: 'Swiggy', tint: '#fc8019' },
];

export default function StoreStatusPanel({ onClose }) {
  const [status, setStatus] = useState(() =>
    Object.fromEntries(PLATFORMS.map((p) => [p.key, true]))
  );

  const setAll = (on) =>
    setStatus(Object.fromEntries(PLATFORMS.map((p) => [p.key, on])));

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />

      <aside className="drawer">
        <div className="drawer-head">
          <h2>Store on/off Status</h2>
          <div className="drawer-head-actions">
            <button className="drawer-icon" title="Settings">
              <GearIcon />
            </button>
            <button className="drawer-icon" onClick={onClose} title="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="drawer-body">
          <section className="store-card store-all">
            <div>
              <h3>Update All Store Status</h3>
              <p>
                Update all stores makes it easy &amp; fast to keep all outlet&apos;s
                information up-to-date in one place.
              </p>
            </div>
            <button className="btn-outline" onClick={() => setAll(true)}>
              Update All Stores
            </button>
          </section>

          <section className="store-card">
            {PLATFORMS.map((p) => (
              <div className="store-row" key={p.key}>
                {platformLogo(p.key) ? (
                  <img className="store-mark" src={platformLogo(p.key)} alt={p.name} />
                ) : (
                  <span className="store-mark letter" style={{ background: p.tint }}>
                    {p.name[0]}
                  </span>
                )}
                <span className="store-name">{p.name}</span>

                <div className={`seg ${status[p.key] ? 'on' : 'off'}`}>
                  <button
                    className="seg-btn"
                    onClick={() => setStatus((s) => ({ ...s, [p.key]: false }))}
                  >
                    Off
                  </button>
                  <button
                    className="seg-btn"
                    onClick={() => setStatus((s) => ({ ...s, [p.key]: true }))}
                  >
                    On
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </aside>
    </>
  );
}

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
       strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
