/**
 * Preview of a receipt, shown when printing could not reach the printer.
 *
 * Receipts are HTML, so the document is handed to the iframe through `srcDoc`.
 * Writing into `contentDocument` instead would need same-origin access, which
 * a sandboxed frame denies — that threw and took the whole UI down with it.
 */
export default function ReceiptModal({ title, html, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="receipt-paper">
            <iframe title={title} srcDoc={html || ''} sandbox="" />
          </div>
          <p className="hint">
            This is exactly what goes to the thermal printer. If nothing came out,
            check the printer in the Printer tab.
          </p>
        </div>

        <div className="modal-foot">
          <button className="btn grey" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
