/**
 * Delivery-platform logos.
 *
 * Zomato's and Swiggy's marks are their trademarks, so they are not committed
 * to this repository. Drop your own 36x36 PNGs at
 *
 *   src/ui/assets/zomato.png
 *   src/ui/assets/swiggy.png
 *
 * and they are picked up automatically. Without them the UI falls back to
 * coloured letter tiles, so a fresh clone builds and runs unchanged.
 */

// eager:false would return promises; this resolves at build time to a URL map.
const files = import.meta.glob('./assets/*.png', { eager: true, query: '?url', import: 'default' });

export function platformLogo(key) {
  return files[`./assets/${key}.png`] ?? null;
}
