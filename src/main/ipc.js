import { ipcMain } from 'electron';
import { loadMenu, menuFilePath } from './menu';
import { loadBranding } from './branding';
import * as orders from './orders';
import * as printer from './printer';
import { IS_DEV } from './printer';
import { buildKotText, buildBillText, toPrintableHtml } from './receipt';

/**
 * The complete list of things the UI is allowed to ask for.
 * Anything not registered here simply does not exist to the renderer.
 */

// Wraps a handler so a thrown error becomes { ok:false, error } instead of
// an unhandled rejection in the UI.
function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      console.error(`[ipc] ${channel} failed:`, err);
      return { ok: false, error: err.message || String(err) };
    }
  });
}

function register() {
  /* menu + tables */
  // Re-read on every request so an edit to menu.csv shows up on the next
  // navigation, without needing the app restarted.
  handle('menu:list', () => loadMenu().menu);
  handle('menu:file', () => menuFilePath());

  /* Outlet branding, read fresh so an edit shows on the next launch. */
  handle('brand:get', () => loadBranding());
  handle('tables:list', () => orders.listTables());

  /* orders */
  handle('order:open', (tableId) => orders.openOrder(tableId));
  handle('order:detail', (orderId) => orders.getOrderDetail(orderId));

  /* KOT: save first, then print. A print failure must never lose the order. */
  handle('kot:add', async (orderId, items) => {
    const kot = orders.addKot(orderId, items);
    const result = await printer.printText(
      buildKotText(kot),
      `KOT ${kot.kot_number} - ${kot.table?.name ?? ''}`
    );
    if (result.printed) orders.markKotPrinted(kot.id);

    return {
      kot,
      print: result,
      preview: IS_DEV ? toPrintableHtml(buildKotText(kot), `KOT ${kot.kot_number}`) : null,
      detail: orders.getOrderDetail(orderId),
    };
  });

  handle('kot:reprint', async (kotId) => {
    const kot = orders.getKot(kotId);
    if (!kot) throw new Error('KOT not found.');
    const result = await printer.printText(
      buildKotText(kot),
      `KOT ${kot.kot_number} - ${kot.table?.name ?? ''}`
    );
    return {
      kot,
      print: result,
      preview: IS_DEV ? toPrintableHtml(buildKotText(kot), `KOT ${kot.kot_number}`) : null,
    };
  });

  /* Save: record items without firing a KOT. */
  handle('order:save', (orderId, items) => orders.saveItems(orderId, items));

  /* Save & EBill: same as Save & Print, but the bill itself is never printed -
     the KOT still goes to the kitchen and the order moves to the billed state. */
  handle('order:ebill', async (orderId, items) => {
    let kotResult = null;
    if (items?.length) {
      const kot = orders.addKot(orderId, items);
      kotResult = await printer.printText(
        buildKotText(kot),
        `KOT ${kot.kot_number} - ${kot.table?.name ?? ''}`
      );
      if (kotResult.printed) orders.markKotPrinted(kot.id);
    }

    const detail = orders.markBilled(orderId);
    return { detail, kotPrint: kotResult };
  });

  /* Save & Print: save the items, fire a KOT for them, then print the bill. */
  handle('order:savePrint', async (orderId, items) => {
    let kotResult = null;
    if (items?.length) {
      const kot = orders.addKot(orderId, items);
      kotResult = await printer.printText(
        buildKotText(kot),
        `KOT ${kot.kot_number} - ${kot.table?.name ?? ''}`
      );
      if (kotResult.printed) orders.markKotPrinted(kot.id);
    }

    const detail = orders.printBill(orderId);
    const billText = buildBillText(detail);
    const billResult = await printer.printText(billText, `Bill ${detail.order.id}`);

    return {
      detail,
      kotPrint: kotResult,
      billPrint: billResult,
      preview: IS_DEV ? toPrintableHtml(billText, `Bill ${detail.order.id}`) : null,
    };
  });

  /* bill */
  handle('bill:preview', (orderId) => {
    const detail = orders.getOrderDetail(orderId);
    if (!detail) throw new Error('Order not found.');
    return { detail, preview: toPrintableHtml(buildBillText(detail), `Bill ${detail.order.id}`) };
  });

  handle('bill:print', async (orderId) => {
    const detail = orders.printBill(orderId);
    const text = buildBillText(detail);
    const result = await printer.printText(text, `Bill ${detail.order.id}`);
    return {
      detail,
      print: result,
      preview: IS_DEV ? toPrintableHtml(text, `Bill ${detail.order.id}`) : null,
    };
  });

  /* Reprint the bill without changing the order's state. */
  handle('bill:reprint', async (orderId) => {
    const detail = orders.getOrderDetail(orderId);
    if (!detail) throw new Error('Order not found.');
    const text = buildBillText(detail);
    const result = await printer.printText(text, `Bill ${detail.order.id}`);
    return { ...result, preview: IS_DEV ? toPrintableHtml(text, `Bill ${detail.order.id}`) : null };
  });

  /* settle */
  handle('order:settle', (orderId, mode) => orders.settleOrder(orderId, mode));

  /* True only in development - the UI uses it to decide whether to show
     receipt previews at all. */
  handle('app:isDev', () => IS_DEV);

  /* reporting */
  handle('report:day', (businessDay) => orders.daySummary(businessDay));
  handle('report:today', () => orders.daySummary());
  handle('report:days', () => orders.reportDays());

  /* printer settings */
  handle('printer:list', () => printer.listPrinters());
  handle('printer:log', () => printer.printLogPath());
  handle('printer:settings', () => printer.getSettings());
  handle('printer:update', (patch) => printer.updateSettings(patch));
  handle('printer:test', async () => {
    // Receipts are HTML now, so the test page is too - it also proves the
    // 80mm width and the rules render correctly on the real paper.
    const body = `
      <div style="text-align:center;font-size:14px;font-weight:700;">*** TEST PRINT ***</div>
      <div class="rule-double"></div>
      <div style="font-size:12px;line-height:1.5;">
        If you can read this line clearly,<br/>
        the printer is set up correctly.
      </div>
      <div class="rule"></div>
      <table style="width:100%;font-size:12px;">
        <tr><td>Left column</td><td style="text-align:right;">999.99</td></tr>
        <tr><td>Right aligned numbers</td><td style="text-align:right;">1234.56</td></tr>
      </table>
      <div class="dotted"></div>
      <div style="text-align:center;font-size:12px;">End of test</div>`;
    return printer.printText(body, 'Test Print');
  });
}

export { register };
