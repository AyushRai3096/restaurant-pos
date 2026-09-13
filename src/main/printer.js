import fs from 'node:fs';
import path from 'node:path';
import { BrowserWindow, app } from 'electron';
import { toPrintableHtml } from './receipt';

/**
 * Printing strategy: render the receipt HTML in a hidden window and call
 * Electron's print(). This uses the normal Windows printer driver, so any
 * thermal printer installed on the machine works without ESC/POS byte handling.
 */

/**
 * Previews are a build-time aid only. In development there is usually no
 * thermal printer attached, so every receipt is returned for on-screen review.
 * In a packaged build this is false and receipts go straight to the printer -
 * a counter must never be interrupted by a preview dialog.
 */
export const IS_DEV = !app.isPackaged;

const DEFAULTS = {
  printerName: '',  // '' means the OS default printer
  silent: true,     // true = no print dialog, straight to paper
  copies: 1,
  enabled: true,    // false = preview only, nothing is sent to paper
};

// Persisted beside the database so the chosen printer survives a restart —
// the counter should not have to re-pick it every morning.
function settingsFile() {
  return path.join(app.getPath('userData'), 'printer.json');
}

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}

let settings = loadSettings();

function getSettings() {
  return { ...settings };
}

function updateSettings(patch) {
  settings = { ...settings, ...patch };
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    console.error('[printer] could not save settings:', err.message);
  }
  return getSettings();
}

/**
 * Every print attempt is appended to print.log beside the database. A packaged
 * build shows no preview, so without this a failed print would be completely
 * silent - no paper and nothing on screen to explain why.
 */
function logPrint(entry) {
  try {
    const file = path.join(app.getPath('userData'), 'print.log');
    const line = `${new Date().toISOString()}  ${entry}\n`;
    fs.appendFileSync(file, line, 'utf8');
  } catch {
    // Logging must never break printing.
  }
}

export function printLogPath() {
  return path.join(app.getPath('userData'), 'print.log');
}

/** Printers installed on this machine. */
async function listPrinters() {
  // Prefer a real, live window; the offscreen ones used for printing get
  // destroyed and would throw.
  const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
  if (!win) {
    logPrint('LIST  no window available');
    return [];
  }
  try {
    const list = await win.webContents.getPrintersAsync();
    logPrint(`LIST  ${list.length} printer(s): ${list.map((p) => p.name).join(' | ') || '(none)'}`);
    return list;
  } catch (err) {
    logPrint(`LIST  failed: ${err.message}`);
    return [];
  }
}

/**
 * Prints receipt text. Returns { printed, reason } — never throws for a
 * printer problem, because a failed print must not lose the saved order.
 */
async function printText(text, title = 'Receipt', { copies } = {}) {
  if (!settings.enabled) return { printed: false, reason: 'Printing is turned off.' };

  const html = toPrintableHtml(text, title);
  // A hidden (not offscreen) window: offscreen rendering hands print() a frame
  // that has not painted yet, which comes out as a blank strip.
  const win = new BrowserWindow({
    show: false,
    webPreferences: {},
  });

  // Electron's print() renders blank for pages loaded from a data: URI, so the
  // receipt is written to a real file and loaded from disk.
  const tmpFile = path.join(app.getPath('temp'), `receipt-${Date.now()}.html`);

  try {
    fs.writeFileSync(tmpFile, html, 'utf8');
    await win.loadFile(tmpFile);
    // Let layout and first paint settle before printing.
    await new Promise((r) => setTimeout(r, 250));

    let heightPx = 0;
    try {
      heightPx = Number(
        await win.webContents.executeJavaScript('document.body.scrollHeight', true)
      );
    } catch { /* measurement is only for the log */ }

    // This printer's driver is a continuous-form one: the physical length it
    // feeds tracks the rendered page's content height (confirmed by print
    // comparison), so the receipt's own CSS padding is what controls spacing —
    // see the body rule in receipt.js. `margins: none` just means "don't add
    // another margin on top of that".
    const options = {
      silent: settings.silent,
      printBackground: false,
      margins: { marginType: 'none' },
    };
    if (settings.printerName) options.deviceName = settings.printerName;
    logPrint(`SIZE  ${title}  ${heightPx || '?'}px`);

    // This driver has ignored other webContents.print() options before
    // (pageSize, margins.custom), so copies is not trusted either - each copy
    // is a separate print() call rather than the `copies` option.
    const copyCount = Math.max(1, Number(copies ?? settings.copies) || 1);
    let result = { printed: true, reason: '' };
    for (let i = 0; i < copyCount && result.printed; i++) {
      result = await new Promise((resolve) => {
        // print() can hang if the spooler is stuck, which would leave the order
        // screen frozen. Fail after 20s rather than waiting for ever.
        const timer = setTimeout(
          () => resolve({ printed: false, reason: 'Printer did not respond (20s timeout).' }),
          20000
        );

        win.webContents.print(options, (success, failureReason) => {
          clearTimeout(timer);
          resolve({ printed: success, reason: failureReason || '' });
        });
      });
    }

    logPrint(
      result.printed
        ? `OK    ${title}  ->  ${settings.printerName || 'system default'}`
        : `FAIL  ${title}  ->  ${settings.printerName || 'system default'}  (${result.reason})`
    );
    return result;
  } catch (err) {
    logPrint(`ERROR ${title}  (${err.message})`);
    return { printed: false, reason: err.message };
  } finally {
    if (!win.isDestroyed()) win.destroy();
    try { fs.unlinkSync(tmpFile); } catch { /* already gone */ }
  }
}

export { printText, listPrinters, getSettings, updateSettings };
