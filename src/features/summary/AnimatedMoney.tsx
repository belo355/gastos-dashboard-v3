import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '../../domain/money';
import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';

const DURATION_MS = 450;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Valor em R$ que "conta" até o novo total; sem animação com movimento reduzido. */
export function AnimatedMoney({ cents }: { cents: number }) {
  const reduced = useReducedMotionPref();
  const [shown, setShown] = useState(cents);
  const from = useRef(cents);

  useEffect(() => {
    const start = from.current;
    from.current = cents;
    if (reduced || start === cents || typeof requestAnimationFrame === 'undefined') {
      setShown(cents);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / DURATION_MS, 1);
      setShown(Math.round(start + (cents - start) * easeOut(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cents, reduced]);

  return <>{formatMoney(shown)}</>;
}
