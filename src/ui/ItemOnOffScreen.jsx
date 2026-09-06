import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconRecentTab, IconAllTab, IconEyeLight } from './Icons';
import SearchSelect from './SearchSelect';
import { platformLogo } from './platformLogos';

/**
 * Item On/Off — marks dishes unavailable when the kitchen runs out.
 *
 * An item switched off is blocked on the order screen and the state persists,
 * so it survives a restart and a menu reload.
 *
 * The Online/Offline and platform tabs are rendered for familiarity but share
 * one availability state: there is no aggregator integration behind them, so
 * an item is simply on or off everywhere.
 */
// Icon tabs above the item list. The platform ones carry a green dot showing
// the store is online, matching the store on/off state.
const PLATFORM_TABS = [
  { key: 'Recent', label: 'Recent', Icon: IconRecentTab },
  { key: 'All', label: 'All', Icon: IconAllTab },
  { key: 'zomato', label: 'zomato', tint: '#e23744', live: true },
  { key: 'swiggy', label: 'swiggy', tint: '#fc8019', live: true },
];

export default function ItemOnOffScreen({ onClose, push }) {
  const [menu, setMenu] = useState([]);
  const [off, setOff] = useState(new Set());
  const [channel, setChannel] = useState('Online');
  const [platform, setPlatform] = useState('All');
  // null = nothing chosen yet, '' = All Categories, otherwise a category name
  const [category, setCategory] = useState(null);
  const [nameFilter, setNameFilter] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  // Selected item names. Presentation only for now - nothing acts on them yet.
  const [selected, setSelected] = useState(new Set());

  const load = useCallback(async () => {
    try {
      const data = await window.api.getAvailability();
      setMenu(data.menu);
      setOff(new Set(data.off));
    } catch (err) {
      push(err.message, 'err');
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(menu.map((m) => m.category))],
    [menu]
  );

  useEffect(() => {
    // Only seed on first load. Using `!category` here would fight the user
    // every time they picked All Categories, which is also falsy.
    if (categories.length === 0) return;
    if (category === null || (category !== '' && !categories.includes(category))) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // The right pane shows one category at a time, filtered by the name search.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter((m) => {
      const matches = q
        ? m.name.toLowerCase().includes(q)
        : category === '' || category === null || m.category === category;
      if (!matches) return false;
      if (statusFilter === 'On') return !off.has(m.name);
      if (statusFilter === 'Off') return off.has(m.name);
      return true;
    });
  }, [menu, category, query, statusFilter, off]);

  /**
   * The list is rendered as one table per category, each with its own heading.
   * Without that, "All Categories" is an unbroken scroll of 196 items with no
   * way to tell where one section ends and the next begins.
   */
  const groups = useMemo(() => {
    const byCat = new Map();
    for (const item of visible) {
      if (!byCat.has(item.category)) byCat.set(item.category, []);
      byCat.get(item.category).push(item);
    }
    return [...byCat.entries()].map(([name, items]) => ({ name, items }));
  }, [visible]);

  function toggleSelected(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  /** Header checkbox: selects or clears every item in that category. */
  function toggleGroup(items) {
    const names = items.map((i) => i.name);
    const allOn = names.every((n) => selected.has(n));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const n of names) {
        if (allOn) next.delete(n);
        else next.add(n);
      }
      return next;
    });
  }

  async function toggleItem(name, makeOff) {
    setBusy(true);
    try {
      setOff(new Set(await window.api.setItemOff(name, makeOff)));
    } catch (err) {
      push(err.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategory(cat, makeOff) {
    setBusy(true);
    try {
      setOff(new Set(await window.api.setCategoryOff(cat, makeOff)));
    } catch (err) {
      push(err.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  const catAllOff = (cat) =>
    menu.filter((m) => m.category === cat).every((m) => off.has(m.name));

  return (
    <div className="ionoff">
      {/* Online / Offline */}
      <div className="io-channels">
        {['Online', 'Offline'].map((c) => (
          <button
            key={c}
            className={`io-channel ${channel === c ? 'active' : ''}`}
            onClick={() => setChannel(c)}
          >
            {c}
          </button>
        ))}
        <div className="io-head-actions">
          <button className="io-gear" title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button className="io-back" onClick={onClose}>
            ‹ Back
          </button>
        </div>
      </div>

      {/* Item On/Off | Addon On/Off */}
      <div className="io-subtabs">
        <button className="io-subtab active">Item On/Off</button>
        <button className="io-subtab">Addon On/Off</button>

        {/* Presentation only - neither button does anything yet. */}
        <div className="io-subtab-actions">
          <button className="io-outline">Logistics</button>
          <button className="io-outline dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" />
            </svg>
            Quick Section Controller
          </button>
        </div>
      </div>

      {/* platform pills */}
      <div className="io-platforms">
        {PLATFORM_TABS.map((t) => (
          <button
            key={t.key}
            className={`io-platform ${platform === t.key ? 'active' : ''}`}
            onClick={() => setPlatform(t.key)}
          >
            <span className="io-plat-icon">
              {t.Icon ? (
                <t.Icon />
              ) : platformLogo(t.key) ? (
                <img src={platformLogo(t.key)} alt={t.label} />
              ) : (
                <span className="io-plat-letter" style={{ background: t.tint }}>
                  {t.label[0].toUpperCase()}
                </span>
              )}
              {t.live && <i className="io-live-dot" />}
            </span>
            <span className="io-plat-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="io-filters">
        {/* Enter runs the search, so the counter does not have to reach for
            the Show button on every lookup. */}
        <input
          className="io-input"
          placeholder="Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setQuery(nameFilter);
            if (e.key === 'Escape') { setNameFilter(''); setQuery(''); }
          }}
        />
        {/* Online display names are a per-platform concept we do not store, so
            this filters nothing yet - it is here to match the layout. */}
        <input
          className="io-input wide"
          placeholder="Online Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setQuery(nameFilter);
          }}
        />
        <SearchSelect
          className="io-ss-category"
          value={category ?? ''}
          onChange={(v) => {
            setCategory(v);
            setQuery('');
          }}
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <SearchSelect
          className="io-ss-status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'All', label: 'All' },
            { value: 'On', label: 'On' },
            { value: 'Off', label: 'Off' },
          ]}
        />
        <button className="btn-red" onClick={() => setQuery(nameFilter)}>
          Show
        </button>
        <button
          className="io-btn"
          onClick={() => {
            setNameFilter('');
            setDisplayName('');
            setStatusFilter('All');
            setQuery('');
          }}
        >
          Clear
        </button>
        <button className="io-btn" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="io-body">
        {/* category rail with a switch per category */}
        <div className="io-rail">
          {categories.map((c) => {
            const allOff = catAllOff(c);
            return (
              <div
                key={c}
                className={`io-rail-row ${category === c && !query ? 'active' : ''}`}
                onClick={() => { setCategory(c); setQuery(''); }}
              >
                <span className="io-rail-name">{c}</span>
                <div className={`seg-split ${allOff ? 'off' : 'on'}`}>
                  <button
                    className="seg-btn"
                    disabled={busy}
                    onClick={(e) => { e.stopPropagation(); toggleCategory(c, true); }}
                  >
                    Off
                  </button>
                  <button
                    className="seg-btn"
                    disabled={busy}
                    onClick={(e) => { e.stopPropagation(); toggleCategory(c, false); }}
                  >
                    On
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* item table */}
        <div className="io-items">
          {groups.length === 0 ? (
            <div className="empty-note">No items match.</div>
          ) : (
            groups.map((group) => (
              <div className="io-group" key={group.name}>
                <div className="io-group-head">
                  <span className="io-group-title">{group.name}</span>
                  {/* Partial Changes, Unscheduled and Queued have no feature
                      behind them yet - they are shown so the key is complete. */}
                  <span className="io-legend">
                    <i className="dot-off" /> Off
                    <i className="dot-partial" /> Partial Changes
                    <i className="dot-on" /> On
                    <i className="dot-unscheduled" /> Unscheduled
                    <i className="dot-queued" /> Queued
                  </span>
                </div>

                <table className="io-table">
                  <thead>
                    <tr>
                      <td className="io-check">
                        <input
                          type="checkbox"
                          checked={group.items.every((i) => selected.has(i.name))}
                          onChange={() => toggleGroup(group.items)}
                        />
                      </td>
                      <td className="io-status">Status</td>
                      <td>Name</td>
                      <td className="io-mark">Mark as</td>
                      <td className="io-action">Action</td>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => {
                      const isOff = off.has(item.name);
                      return (
                        <tr key={`${item.category}-${item.name}`}>
                          <td className="io-check">
                            <input
                              type="checkbox"
                              checked={selected.has(item.name)}
                              onChange={() => toggleSelected(item.name)}
                            />
                          </td>
                          <td className="io-status">
                            <i className={isOff ? 'dot-off' : 'dot-on'} />
                          </td>
                          <td className="io-name">
                            <div className="io-name-wrap">
                              <span className="io-name-text">{item.name}</span>
                              <button className="io-eye" title="View item">
                                <IconEyeLight />
                              </button>
                              {item.variants?.length ? <span className="io-var">V</span> : null}
                            </div>
                          </td>
                          <td className="io-mark">
                            <div className={`seg ${isOff ? 'off' : 'on'}`}>
                              <button
                                className="seg-btn"
                                disabled={busy}
                                onClick={() => toggleItem(item.name, true)}
                              >
                                Off
                              </button>
                              <button
                                className="seg-btn"
                                disabled={busy}
                                onClick={() => toggleItem(item.name, false)}
                              >
                                On
                              </button>
                            </div>
                          </td>
                          {/* Presentation only - neither control does anything yet. */}
                          <td className="io-action">
                            <div className="io-action-wrap">
                              <button className="io-sync" title="Sync">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 2v6h-6" />
                                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                  <path d="M3 22v-6h6" />
                                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                                </svg>
                              </button>
                              <button className="io-status-btn">Status</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
