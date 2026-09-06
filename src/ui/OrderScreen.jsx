import { useEffect, useMemo, useState } from 'react';
import VariantModal from './VariantModal';
import ReceiptModal from './ReceiptModal';
import {
  IconSearch, IconDineIn, IconDelivery, IconPickUp, IconTableNo,
  IconPerson, IconPeople, IconNote, IconPlate,
  IconCash, IconCard, IconDue, IconOther, IconChevronUp,
} from './Icons';

const PAY_MODES = [
  { key: 'Cash', Icon: IconCash },
  { key: 'Card', Icon: IconCard },
  { key: 'Due', Icon: IconDue },
  { key: 'Other', Icon: IconOther },
];

/**
 * The order screen: categories on the left, items in the middle, the running
 * order on the right.
 *
 * `lines` holds what the user has picked but not yet committed. Each action
 * button commits it differently:
 *   Save          - store the items, no KOT, no print
 *   Save & Print  - store, fire a KOT, print KOT and bill
 *   Save & EBill  - store and mark billed, print nothing
 *   KOT           - fire a KOT without printing
 *   KOT & Print   - fire a KOT and print it
 * All of them return to the table grid afterwards.
 *
 * Settling is only offered once the bill has been printed, so it appears in
 * view mode on a billed order rather than alongside the save actions.
 */
export default function OrderScreen({
  tableId,
  orderId: initialOrderId,
  tableName,
  menu,
  mode = 'add',
  onBack,
  onChanged,
  push,
}) {
  const isView = mode === 'view';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [detail, setDetail] = useState(null);
  const [lines, setLines] = useState([]);   // [{ name, price, qty }]
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [variantFor, setVariantFor] = useState(null);
  // Only ever set in development - see IS_DEV in the main process.
  const [receipt, setReceipt] = useState(null);
  const [payMode, setPayMode] = useState('Cash');
  const [itsPaid, setItsPaid] = useState(false);
  // Items marked unavailable on the Item On/Off screen cannot be ordered.
  const [offItems, setOffItems] = useState(new Set());

  // A category whose items are all switched off disappears from the rail.
  const categories = useMemo(
    () => [...new Set(menu.filter((m) => !offItems.has(m.name)).map((m) => m.category))],
    [menu, offItems]
  );

  useEffect(() => {
    if (categories.length === 0) return;
    // Fall back to the first available category when nothing is selected, and
    // also when the selected one has disappeared - switching every item in a
    // category off removes it from the rail, which would otherwise leave the
    // screen pointing at a category that no longer exists.
    if (!category || !categories.includes(category)) setCategory(categories[0]);
  }, [categories, category]);

  useEffect(() => {
    window.api
      .getAvailability()
      .then((d) => setOffItems(new Set(d.off)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!orderId) {
      setDetail(null);
      return;
    }
    window.api
      .getOrderDetail(orderId)
      .then(setDetail)
      .catch((err) => push(err.message, 'err'));
  }, [orderId, push]);

  // The panel is seeded with the whole order when viewing through the eye icon,
  // and whenever the bill has already been printed - at that point the order is
  // closed for edits, so showing only a draft would be misleading.
  useEffect(() => {
    if (!detail) return;
    if (!isView && detail.order?.status !== 'billed') return;
    setLines(detail.bill.lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty })));
  }, [isView, detail]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Items switched off on the Item On/Off screen are hidden outright, not
    // shown disabled - the counter should only see what can be ordered.
    const available = menu.filter((m) => !offItems.has(m.name));
    if (q) return available.filter((m) => m.name.toLowerCase().includes(q));
    return available.filter((m) => m.category === category);
  }, [menu, category, search, offItems]);

  // While searching, the rail lists only categories that still have matches.
  const visibleCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    const hit = new Set(
      menu.filter((m) => m.name.toLowerCase().includes(q)).map((m) => m.category)
    );
    return categories.filter((c) => hit.has(c));
  }, [categories, menu, search]);

  /* ---- line handling ---- */

  function addLine(name, price) {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.name === name && l.price === price);
      if (i === -1) return [...prev, { name, price, qty: 1 }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + 1 };
      return next;
    });
  }

  function pickItem(item) {
    // A printed bill is final: nothing may be added or changed on it.
    if (readOnly) {
      push('Bill already printed. Settle the table to start a new order.', 'warn');
      return;
    }
    if (item.variants?.length) setVariantFor(item);
    else addLine(item.name, item.price);
  }

  function chooseVariant(item, variant) {
    addLine(`${item.name} (${variant.label})`, variant.price);
    setVariantFor(null);
  }

  function setQty(index, qty) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, qty: Math.max(1, qty) } : l)));
  }

  function removeLine(index) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---- actions ---- */

  // Every action needs an order row; it is created lazily on first commit so a
  // table that is opened and abandoned never becomes "running".
  async function ensureOrder() {
    if (orderId) return orderId;
    const order = await window.api.openOrder(tableId);
    setOrderId(order.id);
    return order.id;
  }

  // Returning to the table grid with the table's colour changed is the
  // confirmation, so successful actions stay silent. Failures still speak up.
  function finish() {
    onChanged();
    onBack();
  }

  async function run(fn) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      push(err.message, 'err');
      setBusy(false);
    }
  }

  const orderIsBilled = detail?.order?.status === 'billed';
  const readOnly = isView || orderIsBilled;
  const newLines = readOnly ? [] : lines;

  function requireItems() {
    if (newLines.length > 0) return true;
    push('Add at least one item.', 'warn');
    setBusy(false);
    return false;
  }

  const handleSave = () =>
    run(async () => {
      if (!requireItems()) return;
      const id = await ensureOrder();
      await window.api.saveOrder(id, newLines);
      finish();
    });

  /**
   * Save & Print requires at least one item showing in the right panel. That is
   * the new draft when adding, or the whole order when opened via the eye icon,
   * so the check is the same in both modes.
   */
  const handleSavePrint = () =>
    run(async () => {
      if (lines.length === 0) {
        push('Add at least one item.', 'warn');
        setBusy(false);
        return;
      }

      const id = await ensureOrder();
      const res = await window.api.saveAndPrint(id, newLines);

      // The order is saved either way, so the screen closes regardless; a
      // printer problem is reported without trapping the user here.
      if (!res.billPrint.printed) push(`Saved. Printer: ${res.billPrint.reason}`, 'warn');

      if (res.preview) {
        setReceipt({ title: `Bill #${res.detail.order.id}`, html: res.preview });
        setBusy(false);
        onChanged();
        return;
      }
      finish();
    });

  /**
   * Save & EBill behaves like Save & Print except the bill is never printed:
   * KOTs still go to the kitchen and the table moves to the bill-printed state.
   */
  const handleSaveEBill = () =>
    run(async () => {
      if (lines.length === 0) {
        push('Add at least one item.', 'warn');
        setBusy(false);
        return;
      }

      const id = await ensureOrder();
      const res = await window.api.saveEBill(id, newLines);

      if (res.kotPrint && !res.kotPrint.printed) {
        push(`Billed. KOT printer: ${res.kotPrint.reason}`, 'warn');
      }
      finish();
    });

  /**
   * KOT and KOT & Print behave identically: both fire a KOT for the new items
   * and send it to the kitchen printer. The table stays running - neither one
   * bills the order. Both buttons exist to match Petpooja's layout.
   */
  const handleKot = () =>
    run(async () => {
      if (!requireItems()) return;
      const id = await ensureOrder();

      const res = await window.api.addKot(id, newLines);
      if (!res.print.printed) {
        push(`KOT #${res.kot.kot_number} saved. Printer: ${res.print.reason}`, 'warn');
      }

      // During development the ticket is shown on screen instead of coming out
      // of a printer. A packaged build returns null here and goes straight back.
      if (res.preview) {
        setReceipt({ title: `KOT #${res.kot.kot_number}`, html: res.preview });
        setBusy(false);
        onChanged();
        return;
      }
      finish();
    });

  /** Print: reprints the bill and returns to the grid. The table stays in the
   *  bill-printed state - only Settle & Save clears it. */
  const handleReprint = () =>
    run(async () => {
      const out = await window.api.reprintBill(orderId);
      if (!out.printed) push(`Printer: ${out.reason}`, 'warn');

      if (out.preview) {
        setReceipt({ title: `Bill #${orderId}`, html: out.preview });
        setBusy(false);
        return;
      }
      finish();
    });

  const handleSettle = () =>
    run(async () => {
      const res = await window.api.settleOrder(orderId, payMode);
      finish();
    });

  /* ---- derived ---- */

  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  // Once the bill is printed the screen switches to its settle actions, no
  // matter whether the table was tapped or opened through the eye icon.
  const tableNo = tableName.replace(/^T/i, '');

  return (
    <div className="order-screen">
      {/* ---------- category rail ---------- */}
      <div className="cat-rail">
        {visibleCategories.map((c) => (
          <button
            key={c}
            className={`cat-item ${category === c ? 'active' : ''}`}
            onClick={() => {
              setCategory(c);
              setSearch('');
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ---------- item grid ---------- */}
      <div className="item-pane">
        <div className="item-search">
          <IconSearch />
          <input
            placeholder="Search item"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="item-scroll">
          {visibleItems.length === 0 ? (
            <div className="empty-note">No items match your search.</div>
          ) : (
            <div className="item-grid">
              {visibleItems.map((item) => (
                <button
                  key={`${item.category}-${item.name}`}
                  className={`item-card ${readOnly ? 'locked' : ''}`}
                  onClick={() => pickItem(item)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- order panel ---------- */}
      <aside className="order-pane">
        <div className="mode-tabs">
          <button className="mode-tab active"><IconDineIn /> Dine In</button>
          <button className="mode-tab"><IconDelivery /> Delivery</button>
          <button className="mode-tab"><IconPickUp /> Pick Up</button>
        </div>

        <div className="order-iconbar">
          <button className="oi-btn">
            <IconTableNo />
            <span className="oi-count">{tableNo}</span>
          </button>
          <button className="oi-btn"><IconPerson /></button>
          <button className="oi-btn"><IconPeople /></button>
          <button className="oi-btn"><IconNote /></button>
          <span className="oi-spacer" />
          <span className="oi-mode">Dine In</span>
        </div>

        <div className="table-row">
          <label>Please Enter Table No.</label>
          <input value={tableNo} readOnly />
          <button className="view-kot" onClick={onBack}>View Kot</button>
        </div>

        <div className="order-cols">
          <span className="oc-items">ITEMS</span>
          <span className="oc-check">CHECK ITEMS</span>
          <span className="oc-qty">QTY.</span>
          <span className="oc-price">PRICE</span>
        </div>

        <div className="order-lines">
          {lines.length === 0 ? (
            <div className="order-empty">
              <IconPlate />
              <b>No Item Selected</b>
              <span>Please Select Item from Left Menu Item</span>
            </div>
          ) : (
            lines.map((l, i) => (
              <div className="order-line" key={`${l.name}-${l.price}`}>
                {/* A billed order is closed for edits, so the remove and
                    quantity controls are dropped rather than disabled. */}
                {readOnly ? (
                  <span className="ol-remove-spacer" />
                ) : (
                  <button className="ol-remove" onClick={() => removeLine(i)} title="Remove">
                    ✕
                  </button>
                )}

                <span className="ol-name">{l.name}</span>
                <span className="ol-check" />

                <span className="ol-qty">
                  {readOnly ? (
                    <span className="ol-qty-static">{l.qty}</span>
                  ) : (
                    <>
                      <button onClick={() => setQty(i, l.qty - 1)}>−</button>
                      <input
                        value={l.qty}
                        onChange={(e) => setQty(i, Number(e.target.value) || 1)}
                      />
                      <button onClick={() => setQty(i, l.qty + 1)}>+</button>
                    </>
                  )}
                </span>

                <span className="ol-price">
                  {(l.price * l.qty).toFixed(2)}
                  <small>{l.price.toFixed(2)}</small>
                </span>
              </div>
            ))
          )}
        </div>

        <div className="order-foot">
          <div className="total-bar">
            <button className="btn-split">Split</button>
            <span className="total-label">Total</span>
            <span className="total-value">{Math.round(total)}</span>
          </div>

          <div className="pay-row">
            {PAY_MODES.map(({ key, Icon }) => (
              <button
                key={key}
                className={`pay-btn ${payMode === key ? 'active' : ''}`}
                onClick={() => setPayMode(key)}
              >
                <Icon /> {key} <span className="tick">✓</span>
              </button>
            ))}
            <button className="pay-btn">
              <IconChevronUp /> More <span className="tick">✓</span>
            </button>
          </div>

          {/* The billed layout draws its own "It's Paid" between Settle & Save
              and the Print/EBill row, so this one is hidden there. */}
          {!orderIsBilled && (
            <label className="paid-row">
              <input
                type="checkbox"
                checked={itsPaid}
                onChange={(e) => setItsPaid(e.target.checked)}
              />
              It&apos;s Paid
            </label>
          )}

          <div className="action-row">
            {orderIsBilled ? (
              <>
                <button
                  className="act-btn settle-save"
                  disabled={busy}
                  onClick={handleSettle}
                >
                  Settle &amp; Save
                </button>
                <label className="paid-row inline">
                  <input
                    type="checkbox"
                    checked={itsPaid}
                    onChange={(e) => setItsPaid(e.target.checked)}
                  />
                  It&apos;s Paid
                </label>
                <div className="billed-row">
                  <button className="act-btn" disabled={busy} onClick={handleReprint}>
                    Print
                  </button>
                  <button className="act-btn" disabled={busy} onClick={onBack}>
                    EBill
                  </button>
                </div>
              </>
            ) : (
              <>
                <button className="act-btn" disabled={busy} onClick={handleSave}>
                  Save
                </button>
                <button className="act-btn" disabled={busy} onClick={handleSavePrint}>
                  Save &amp; Print
                </button>
                <button className="act-btn" disabled={busy} onClick={handleSaveEBill}>
                  Save &amp; EBill
                </button>
                <button className="act-btn dark" disabled={busy} onClick={handleKot}>
                  KOT
                </button>
                <button className="act-btn dark" disabled={busy} onClick={handleKot}>
                  KOT &amp; Print
                </button>
                <button className="act-btn ghost" disabled={busy} onClick={onBack}>
                  Hold
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {receipt && (
        <ReceiptModal
          title={receipt.title}
          html={receipt.html}
          onClose={() => {
            setReceipt(null);
            finish();
          }}
        />
      )}

      {variantFor && (
        <VariantModal
          item={variantFor}
          onPick={(v) => chooseVariant(variantFor, v)}
          onClose={() => setVariantFor(null)}
        />
      )}

    </div>
  );
}
