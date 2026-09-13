/**
 * KOT and bill templates for an 80mm thermal printer.
 *
 * Built as HTML tables rather than space-padded monospace text: columns then
 * line up regardless of font, and long item names wrap inside their own cell
 * instead of pushing the rest of the row out of alignment.
 *
 * Layouts follow the outlet's printed receipts exactly - see the header and
 * totals blocks below.
 */

export const RESTAURANT = {
  name: 'Veer Ji Malai Chaap Wale',
  branch: '(Paschim Vihar)',
  address: 'ADD: SHOP NO. 52, BG-8, PASCHIM VIHAR, NEW DELHI-110063',
  contact: 'CONTACT: 7011161638, TEL: 011-44716249',
  gstin: 'GSTIN: 07KMYPK6611K1Z6',
  cashier: 'biller',
};

const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const money = (n) => Number(n).toFixed(2);

/** 13/08/26 23:12 — the format used on the printed receipts. */
function stamp(value) {
  const d = value ? new Date(String(value).replace(' ', 'T')) : new Date();
  const p = (n) => String(n).padStart(2, '0');
  const date = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  return { date, time, full: `${date} ${time}` };
}

/* ---------------------------------------------------------------- KOT ---- */

/**
 * The kitchen ticket. No prices — the cook does not need them. Item names are
 * bold so they read at a glance, and a "--" fills the note column when there
 * is nothing to say about a line.
 */
export function buildKotText(kot) {
  const when = stamp(kot.created_at);
  const rows = kot.items
    .map(
      (i) => `
      <tr>
        <td class="k-item">${esc(i.item_name)}</td>
        <td class="k-note">${esc(i.note || '--')}</td>
        <td class="k-qty">${i.qty}</td>
      </tr>`
    )
    .join('');

  return `
<div class="kot">
  <div class="k-head">
    <div>${when.full}</div>
    <div>KOT - ${kot.kot_number}</div>
    <div class="bold">Dine In</div>
    <div class="bold">Table No: ${esc(kot.table?.name?.replace(/^T/i, '') ?? '-')}</div>
  </div>

  <div class="dotted"></div>

  <table class="k-table">
    <thead>
      <tr>
        <td class="k-item">Item</td>
        <td class="k-note">Special<br/>Note</td>
        <td class="k-qty">Qty.</td>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

/* --------------------------------------------------------------- BILL ---- */

/**
 * The customer bill. Menu prices include GST, so each line shows its
 * tax-exclusive value and the taxes are listed separately beneath.
 */
export function buildBillText(detail) {
  const { order, table, bill } = detail;
  const when = stamp(order.billed_at || order.created_at);

  const tokens = (detail.kots || [])
    .filter((k) => k.kot_number > 0)
    .map((k) => k.kot_number)
    .join(', ');

  const rows = bill.lines
    .map(
      (l) => `
      <tr>
        <td class="b-item">${esc(l.name)}</td>
        <td class="b-qty">${l.qty}</td>
        <td class="b-num">${money(l.price)}</td>
        <td class="b-num">${money(l.amount)}</td>
      </tr>`
    )
    .join('');

  const roundOff = bill.roundOff ?? 0;

  return `
<div class="bill">
  <div class="b-head">
    <div class="b-name">${esc(RESTAURANT.name)}</div>
    <div class="b-name">${esc(RESTAURANT.branch)}</div>
    <div class="b-addr">${esc(RESTAURANT.address)}</div>
    <div class="b-addr">${esc(RESTAURANT.contact)}</div>
    <div class="b-addr">${esc(RESTAURANT.gstin)}</div>
  </div>

  <div class="rule"></div>
  <div class="rule rule-gap"></div>

  <table class="b-meta">
    <tr>
      <td>Date: ${when.date}</td>
      <td class="right bold">Dine In: ${esc(table?.name?.replace(/^T/i, '') ?? '-')}</td>
    </tr>
    <tr>
      <td>${when.time}</td>
      <td></td>
    </tr>
    <tr>
      <td>Cashier: ${esc(RESTAURANT.cashier)}</td>
      <td class="right">Bill No.: ${order.id}</td>
    </tr>
    ${tokens ? `<tr><td colspan="2" class="bold">Token No.: ${esc(tokens)}</td></tr>` : ''}
  </table>

  <div class="rule"></div>

  <table class="b-table">
    <thead>
      <tr class="head-row">
        <td class="b-item">Item</td>
        <td class="b-qty">Qty.</td>
        <td class="b-num">Price</td>
        <td class="b-num">Amount</td>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="rule"></div>

  <table class="b-totals">
    <tr>
      <td>Total Qty: ${bill.itemCount}</td>
      <td class="right">Sub Total</td>
      <td class="b-num">${money(bill.subTotal)}</td>
    </tr>
    <tr>
      <td></td>
      <td class="right nowrap">CGST@2.5 2.5%</td>
      <td class="b-num">${money(bill.cgst)}</td>
    </tr>
    <tr>
      <td></td>
      <td class="right nowrap">SGST@2.5 2.5%</td>
      <td class="b-num">${money(bill.sgst)}</td>
    </tr>
    <tr class="roundoff">
      <td></td>
      <td class="right small">Round off</td>
      <td class="b-num small">${roundOff > 0 ? '' : roundOff < 0 ? '-' : ''}${money(Math.abs(roundOff))}</td>
    </tr>
    <tr class="grand">
      <td></td>
      <td class="right bold">Grand Total</td>
      <td class="b-num bold">₹${money(bill.roundedTotal)}</td>
    </tr>
  </table>

  <div class="rule"></div>

  <div class="b-thanks">Thanks</div>
</div>`;
}

/* ------------------------------------------------------------ printing ---- */

const STYLES = `
  /* This printer's driver feeds a continuous form sized to the rendered page,
     so body padding is what actually controls the blank space around the
     printout - confirmed by comparing printouts at different padding values.
     Content lives in the 72mm printable strip of the 80mm roll. */
  @page { size: 80mm auto; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    width: 72mm;
    box-sizing: border-box;
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 12px;
    line-height: 1.25;
    color: #000;
    padding: 2mm 7mm 55mm;
  }
  * { box-sizing: border-box; }
  table { table-layout: fixed; }
  td { word-wrap: break-word; overflow-wrap: break-word; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 1px 0; }
  .bold { font-weight: 700; }
  .right { text-align: right; }
  .nowrap { white-space: nowrap; }
  .small { font-size: 10px; }

  /* A thick line is the "bold" look here. Two stacked .rule divs stand in for
     a double rule - border-style:double renders unreliably on thermal drivers.
     .dotted is the KOT's item/header separator. */
  .rule { border-top: 2px solid #000; margin: 2px 0; }
  .rule-gap { margin-top: 8px; }
  .dotted { border-top: 2px dotted #000; margin: 4px 0; }

  /* ---- KOT ---- */
  .k-head { text-align: center; font-size: 11.5px; line-height: 1.35; }
  .k-head .bold { font-size: 11.5px; }
  .k-table td { padding: 0; }
  .k-table thead td { font-size: 12px; }
  .k-item { width: 58%; font-weight: 700; font-size: 12px; }
  .k-table thead .k-item { font-weight: 400; }
  .k-note { width: 22%; text-align: center; }
  .k-qty  { width: 20%; text-align: center; }

  /* ---- bill ---- */
  .b-head { text-align: center; }
  .b-name { font-size: 13px; font-weight: 700; }
  .b-addr { font-size: 10px; line-height: 1.3; }
  .b-meta td { font-size: 12px; }
  .b-table thead td { font-size: 11.5px; }
  .b-item { width: 42%; }
  .b-qty  { width: 12%; text-align: center; }
  .b-num  { text-align: right; width: 25%; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .b-totals td { font-size: 12px; }
  .b-totals td.small { font-size: 10px; }
  /* A border on <tr> is not painted in print rendering, so the rules go on the
     cells: under the column header, and above round-off/grand total - that
     separator has to sit above Round off, not above Grand Total, or Round off
     visually reads as part of the CGST/SGST block instead of the total. */
  .b-table thead .head-row td { border-bottom: 1px solid #000; padding-bottom: 2px; }
  .b-table tbody tr:first-child td { padding-top: 3px; }
  .b-totals .roundoff td { padding-top: 4px; border-top: 1px solid #000; }
  .b-totals .grand td { font-size: 15px; padding-top: 2px; }
  .b-totals .grand td.b-num { padding-left: 5px; }
  .b-thanks { text-align: center; font-size: 12px; margin-top: 4px; }
`;

/** Wraps a receipt body in a printable document. */
export function toPrintableHtml(body, title) {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>${esc(title)}</title>
<style>${STYLES}</style></head>
<body>${body}</body></html>`;
}
