import { useEffect, useRef } from 'react';

const IDLE_MS = 10 * 60 * 1000;
const WARN_MS = 9 * 60 * 1000;

export function useIdleTimeout(
  enabled: boolean,
  onTimeout: () => void,
  onWarn: () => void,
  onActive: () => void,
) {
  const onTimeoutRef = useRef(onTimeout);
  const onWarnRef = useRef(onWarn);
  const onActiveRef = useRef(onActive);
  onTimeoutRef.current = onTimeout;
  onWarnRef.current = onWarn;
  onActiveRef.current = onActive;

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let warnId: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timeoutId);
      clearTimeout(warnId);
      onActiveRef.current();
      warnId = setTimeout(() => onWarnRef.current(), WARN_MS);
      timeoutId = setTimeout(() => onTimeoutRef.current(), IDLE_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warnId);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [enabled]);
}
