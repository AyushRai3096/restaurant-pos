import { useCallback, useEffect, useState } from 'react';
import TableGrid from './TableGrid';
import OrderScreen from './OrderScreen';
import PrinterSettings from './PrinterSettings';
import ReportsScreen from './ReportsScreen';
import StoreStatusPanel from './StoreStatusPanel';
import ItemOnOffScreen from './ItemOnOffScreen';
import ReceiptModal from './ReceiptModal';
import Toasts, { useToasts } from './Toasts';
import appIcon from '../../assets/icon.png';
import {
  IconToggle, IconStore, IconLive, IconOrders, IconRecent, IconHold,
  IconAlerts, IconHeadset, IconLogout, IconSearch, IconRefresh,
} from './Icons';

// Branding is read from branding.json in the app data folder, so the outlet
// can set its own name and logo without a rebuild. These are only the values
// used before that file has loaded.
const FALLBACK_BRAND = {
  outletName: 'Veer Ji Malai Chaap Wale',
  branchName: '(Paschim Vihar)',
  outletCode: '',
  markText: 'V',
  wordmark: 'VEERJI',
  wordmarkAccent: 'POS',
  tagline: 'Restaurant Management',
  logo: null,
};

const NAV_ITEMS = [
  { key: 'itemonoff', label: 'Item On/Off', Icon: IconToggle },
  { key: 'store',     label: 'Store',       Icon: IconStore },
  { key: 'live',      label: 'Live View',   Icon: IconLive },
  { key: 'orders',    label: 'Orders',      Icon: IconOrders },
  { key: 'recent',    label: 'Recent',      Icon: IconRecent },
  { key: 'hold',      label: 'Hold',        Icon: IconHold },
  { key: 'alerts',    label: 'Alerts',      Icon: IconAlerts },
  { key: 'zomato',    label: 'Zomato Help', Icon: IconHeadset },
  { key: 'logout',    label: 'Logout',      Icon: IconLogout },
];

export default function App() {
  const [tables, setTables] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null); // { orderId, tableName }
  const [menu, setMenu] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [receipt, setReceipt] = useState(null); // { title, html }
  const [spinning, setSpinning] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [brand, setBrand] = useState(FALLBACK_BRAND);
  const [showStore, setShowStore] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const { toasts, push, dismiss } = useToasts();

  const refreshTables = useCallback(async () => {
    try {
      setTables(await window.api.listTables());
    } catch (err) {
      push(err.message, 'err');
    }
  }, [push]);

  useEffect(() => {
    window.api.listMenu().then(setMenu).catch((err) => push(err.message, 'err'));
    window.api.getBranding().then(setBrand).catch(() => {});
  }, [push]);

  useEffect(() => {
    refreshTables();
  }, [refreshTables]);

  // Ctrl+R opens the reports screen. Electron binds Ctrl+R to "reload the
  // window" by default, so the browser default has to be suppressed here or
  // the app would refresh instead.
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setShowReports((v) => !v);
      }
      if (e.key === 'Escape') {
        setShowReports(false);
        setShowStore(false);
        setShowItems(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The cards show minutes since the order opened, so re-read the floor once a
  // minute to keep those counters honest.
  useEffect(() => {
    const id = setInterval(refreshTables, 60000);
    return () => clearInterval(id);
  }, [refreshTables]);

  function handleOpenTable(table) {
    // Tapping a table always opens a clean "add items" screen. The order row
    // may already exist, but the panel starts empty so the new KOT is clear.
    setActiveOrder({
      tableId: table.id,
      orderId: table.order_id || null,
      tableName: table.name,
      mode: 'add',
    });
  }

  /** Returns to the table grid from wherever the user is. */
  function handleBack() {
    setActiveOrder(null);
    setShowReports(false);   // these render ahead of the grid, so clear them too
    setShowItems(false);
    refreshTables();
  }

  // Printer icon on a card: print (or reprint) that table's bill.
  async function handlePrintBillFor(table) {
    if (!table.order_id) return;
    try {
      const res = await window.api.printBill(table.order_id);
      if (res.print.printed) push('Bill printed.', 'ok');
      else setReceipt({ title: `Bill #${res.detail.order.id}`, html: res.preview });
      refreshTables();
    } catch (err) {
      push(err.message, 'err');
    }
  }

  // Eye icon on a card: open the order screen read-only, showing every KOT
  // placed on that table so far.
  function handlePreview(table) {
    if (!table.order_id) return;
    setActiveOrder({
      tableId: table.id,
      orderId: table.order_id,
      tableName: table.name,
      mode: 'view',
    });
  }

  function handleRefresh() {
    setSpinning(true);
    refreshTables();
    setTimeout(() => setSpinning(false), 600);
  }

  // Buttons that are not part of this build stay inert and say nothing.
  function notReady() {}

  return (
    <div className="app">
      {/* ---------- window title bar ---------- */}
      <div className="titlebar">
        <img className="titlebar-icon" src={appIcon} alt="" />
        <span className="titlebar-text">
          {brand.outletName} {brand.branchName}
          {brand.outletCode ? ` (${brand.outletCode})` : ''} - {brand.tagline}
        </span>
        <div className="titlebar-controls">
          <button className="tb-btn" title="Minimise" onClick={() => window.api.windowMinimize()}>&#8211;</button>
          <button className="tb-btn" title="Maximise" onClick={() => window.api.windowToggleMaximize()}>&#9633;</button>
          <button className="tb-btn close" title="Close" onClick={() => window.api.windowClose()}>&#10005;</button>
        </div>
      </div>

      {/* ---------- main nav ---------- */}
      <header className="navbar">
        <button className="hamburger" onClick={() => setShowSettings(true)} title="Settings">
          <i /><i /><i />
        </button>

        <div className="logo">
          {brand.logo ? (
            <img className="logo-img" src={brand.logo} alt={brand.outletName} />
          ) : (
            <>
              <span className="logo-mark">{brand.markText}</span>
              <span className="logo-text">
                {brand.wordmark}
                <span>{brand.wordmarkAccent}</span>
              </span>
            </>
          )}
        </div>

        {/* Returns to the table grid so another table can be picked. */}
        <button className="btn-red" onClick={handleBack}>
          New Order
        </button>

        <div className="search-box">
          <IconSearch />
          <input placeholder="Bill No" />
        </div>

        <div className="search-box">
          <IconSearch />
          <input placeholder="KOT No." />
        </div>

        <nav className="nav-actions">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className="nav-item"
              onClick={
                key === 'store'
                  ? () => setShowStore(true)
                  : key === 'itemonoff'
                    ? () => setShowItems(true)
                    : () => notReady(label)
              }
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}

          <button className="btn-help" onClick={() => notReady('Help')}>
            Need Help ?
          </button>
        </nav>
      </header>

      {showItems ? (
        <ItemOnOffScreen onClose={() => setShowItems(false)} push={push} />
      ) : showReports ? (
        <ReportsScreen onClose={() => setShowReports(false)} push={push} />
      ) : activeOrder ? (
        <OrderScreen
          tableId={activeOrder.tableId}
          orderId={activeOrder.orderId}
          tableName={activeOrder.tableName}
          mode={activeOrder.mode}
          menu={menu}
          onBack={handleBack}
          onChanged={refreshTables}
          push={push}
        />
      ) : (
        <>
          {/* ---------- page bar ---------- */}
          <div className="pagebar">
            <h1 className="page-title">Table View</h1>

            <div className="pagebar-right">
              <button
                className={`icon-btn ${spinning ? 'spin' : ''}`}
                onClick={handleRefresh}
                title="Refresh"
              >
                <IconRefresh />
              </button>
              <button className="btn-red" onClick={() => notReady('Add Table')}>
                Add Table
              </button>
              <button className="btn-red" onClick={() => notReady('Delivery')}>
                Delivery
              </button>
              <button className="btn-red" onClick={() => notReady('Pick Up')}>
                Pick Up
              </button>
            </div>
          </div>

          {/* ---------- legend ---------- */}
          <div className="legendbar">
            <button
              className={`move-toggle ${moveMode ? 'on' : ''}`}
              onClick={() => setMoveMode((v) => !v)}
            >
              <span className="toggle-pill" />
              Move KOT / Items
            </button>

            <span className="legend-item"><span className="dot blank" /> Blank Table</span>
            <span className="legend-item"><span className="dot running" /> Running Table</span>
            <span className="legend-item"><span className="dot printed" /> Printed Table</span>
            <span className="legend-item"><span className="dot paid" /> Paid Table</span>
            <span className="legend-item"><span className="dot runkot" /> Running KOT Table</span>
          </div>

          <TableGrid
            tables={tables}
            onSelect={handleOpenTable}
            onPrintBill={handlePrintBillFor}
            onPreview={handlePreview}
          />
        </>
      )}

      {showStore && <StoreStatusPanel onClose={() => setShowStore(false)} />}

      {showSettings && (
        <PrinterSettings onClose={() => setShowSettings(false)} push={push} />
      )}

      {receipt && (
        <ReceiptModal
          title={receipt.title}
          html={receipt.html}
          onClose={() => setReceipt(null)}
        />
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
