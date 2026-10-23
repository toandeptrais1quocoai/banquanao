import { useEffect, useRef } from 'react';

/**
 * Gọi `tick` định kỳ chỉ khi tab đang hiện; dừng khi ẩn tab.
 * `enabled` = false để tắt hẳn (vd. đơn đã hoàn tất).
 */
export function useVisibilityPoll(tick, { intervalMs = 12000, enabled = true } = {}) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!enabled) return undefined;

    let timer = null;

    function clear() {
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      clear();
      if (document.visibilityState !== 'visible') return;
      timer = window.setInterval(() => {
        tickRef.current?.();
      }, intervalMs);
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        tickRef.current?.();
        start();
      } else {
        clear();
      }
    }

    function onFocus() {
      if (document.visibilityState === 'visible') tickRef.current?.();
    }

    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, intervalMs]);
}
