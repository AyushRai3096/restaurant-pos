import { useCallback } from 'react';

/**
 * On-screen notifications are switched off: the POS confirms actions by what it
 * does — the table changes colour, the screen returns to the grid — rather than
 * by popping a message over the counter.
 *
 * `push` is kept as a no-op so every caller keeps working, and errors still
 * reach the console for debugging.
 */
export function useToasts() {
  const push = useCallback((message, kind = 'info') => {
    if (kind === 'err') console.error('[pos]', message);
    else console.info('[pos]', message);
  }, []);

  const dismiss = useCallback(() => {}, []);

  return { toasts: [], push, dismiss };
}

export default function Toasts() {
  return null;
}
