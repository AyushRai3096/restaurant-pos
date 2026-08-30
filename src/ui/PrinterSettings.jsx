import { useEffect, useState } from 'react';

/** Choose the thermal printer and verify it with a test print. */
export default function PrinterSettings({ onClose, push }) {
  const [printers, setPrinters] = useState([]);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  // Toasts are switched off, so the test result is shown inline instead.
  const [result, setResult] = useState(null);
  const [logPath, setLogPath] = useState('');

  useEffect(() => {
    Promise.all([window.api.listPrinters(), window.api.getPrinterSettings()])
      .then(([list, current]) => {
        setPrinters(list);
        setSettings(current);
      })
      .catch((err) => push(err.message, 'err'));

    window.api.printLogPath().then(setLogPath).catch(() => {});
  }, [push]);

  async function patch(change) {
    try {
      setSettings(await window.api.updatePrinterSettings(change));
    } catch (err) {
      push(err.message, 'err');
    }
  }

  async function handleTest() {
    setBusy(true);
    setResult(null);
    try {
      const res = await window.api.testPrint();
      setResult(
        res.printed
          ? { ok: true, text: 'Test page sent to the printer.' }
          : { ok: false, text: res.reason || 'The printer did not accept the job.' }
      );
    } catch (err) {
      setResult({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Printer Settings</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {!settings ? (
            <p className="hint">Loading…</p>
          ) : (
            <>
              <div className="field">
                <label>Thermal printer</label>
                <select
                  value={settings.printerName}
                  onChange={(e) => patch({ printerName: e.target.value })}
                >
                  <option value="">System default printer</option>
                  {printers.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.displayName || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Copies per KOT</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={settings.copies}
                  onChange={(e) => patch({ copies: Number(e.target.value) })}
                />
              </div>

              <div className="check-row">
                <input
                  id="enabled"
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => patch({ enabled: e.target.checked })}
                />
                <label htmlFor="enabled" style={{ margin: 0, textTransform: 'none' }}>
                  Printing enabled
                </label>
              </div>

              <div className="check-row">
                <input
                  id="silent"
                  type="checkbox"
                  checked={settings.silent}
                  onChange={(e) => patch({ silent: e.target.checked })}
                />
                <label htmlFor="silent" style={{ margin: 0, textTransform: 'none' }}>
                  Print without showing the dialog
                </label>
              </div>

              {result && (
                <p className={`print-result ${result.ok ? 'ok' : 'err'}`}>
                  {result.text}
                </p>
              )}

              <p className="hint">
                Turn the dialog off once the right printer is selected — a busy counter
                cannot stop to confirm every KOT.
                {printers.length === 0 && ' No printers were detected on this machine.'}
              </p>

              {logPath && (
                <p className="hint">
                  Every print attempt is recorded in:
                  <br />
                  <code>{logPath}</code>
                </p>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn grey" onClick={onClose}>
            Close
          </button>
          <button className="btn" onClick={handleTest} disabled={busy || !settings}>
            {busy ? 'Printing…' : 'Test Print'}
          </button>
        </div>
      </div>
    </div>
  );
}
