import { contextBridge, ipcRenderer } from 'electron';

/**
 * The bridge between the UI and the main process.
 * Whatever is listed here is the entire surface the UI can reach — nothing else.
 */

// Every main-process handler replies { ok, data } or { ok:false, error }.
// Unwrap it here so the UI can just `await api.listTables()` and use the value.
async function call(channel, ...args) {
  const res = await ipcRenderer.invoke(channel, ...args);
  if (!res?.ok) throw new Error(res?.error || 'Something went wrong.');
  return res.data;
}

contextBridge.exposeInMainWorld('api', {
  /* menu + tables */
  listMenu: () => call('menu:list'),
  menuFilePath: () => call('menu:file'),
  getBranding: () => call('brand:get'),
  listTables: () => call('tables:list'),

  /* orders */
  openOrder: (tableId) => call('order:open', tableId),
  getOrderDetail: (orderId) => call('order:detail', orderId),

  /* KOT */
  addKot: (orderId, items) => call('kot:add', orderId, items),
  reprintKot: (kotId) => call('kot:reprint', kotId),

  /* order screen actions */
  saveOrder: (orderId, items) => call('order:save', orderId, items),
  saveEBill: (orderId, items) => call('order:ebill', orderId, items),
  saveAndPrint: (orderId, items) => call('order:savePrint', orderId, items),

  /* bill */
  previewBill: (orderId) => call('bill:preview', orderId),
  printBill: (orderId) => call('bill:print', orderId),
  reprintBill: (orderId) => call('bill:reprint', orderId),

  /* settle */
  settleOrder: (orderId, mode) => call('order:settle', orderId, mode),

  isDev: () => call('app:isDev'),

  /* reporting */
  getDayReport: (businessDay) => call('report:day', businessDay),
  getTodayReport: () => call('report:today'),
  getReportDays: () => call('report:days'),

  /* printer */
  listPrinters: () => call('printer:list'),
  printLogPath: () => call('printer:log'),
  getPrinterSettings: () => call('printer:settings'),
  updatePrinterSettings: (patch) => call('printer:update', patch),
  testPrint: () => call('printer:test'),
});
