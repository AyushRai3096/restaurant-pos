import { useState } from 'react';

/**
 * Shown when an item has more than one size or portion. Nothing is added to the
 * order until Save is pressed, so the chooser can be cancelled cleanly.
 */
export default function VariantModal({ item, onPick, onClose }) {
  const [chosen, setChosen] = useState(item.variants[0]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal variation" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>
            {item.name} | ₹{Number(chosen.price).toFixed(2)}
          </span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="variant-label">Variation</p>
          <div className="variant-grid">
            {item.variants.map((v) => (
              <button
                key={v.label}
                className={`variant-btn ${chosen.label === v.label ? 'active' : ''}`}
                onClick={() => setChosen(v)}
              >
                <b>{v.label}</b>
                <span>₹{v.price}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn plain" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={() => onPick(chosen)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
