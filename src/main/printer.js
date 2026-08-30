import fs from 'node:fs';
import path from 'node:path';
import { BrowserWindow, app } from 'electron';
import { toPrintableHtml } from './receipt';

/**
 * Printing strategy: render the receipt HTML in an offscreen window and call
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

let settings = {
  printerName: '',  // '' means the OS default printer
  silent: true,     // true = no print dialog, straight to paper
  copies: 1,
  enabled: true,    // false = preview only, nothing is sent to paper
};

function getSettings() {
  return { ...settings };
}

function updateSettings(patch) {
  settings = { ...settings, ...patch };
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
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return [];
  try {
    return await win.webContents.getPrintersAsync();
  } catch {
    return [];
  }
}

/**
 * Prints receipt text. Returns { printed, reason } — never throws for a
 * printer problem, because a failed print must not lose the saved order.
 */
async function printText(text, title = 'Receipt') {
  if (!settings.enabled) return { printed: false, reason: 'Printing is turned off.' };

  const html = toPrintableHtml(text, title);
  const win = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true, javascript: false },
  });

  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

    const options = {
      silent: settings.silent,
      printBackground: false,
      copies: Math.max(1, Number(settings.copies) || 1),
      margins: { marginType: 'none' },
    };
    if (settings.printerName) options.deviceName = settings.printerName;

    const result = await new Promise((resolve) => {
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
  }
}

export { printText, listPrinters, getSettings, updateSettings };
