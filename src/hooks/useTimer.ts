import { useEffect, useRef, useState } from 'react';

/** Cuenta atrás en segundos; se detiene en 0 o al pausar. */
export function useTimer(totalSeconds: number, running: boolean, key?: string | number) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const endRef = useRef(0);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    endRef.current = Date.now() + totalSeconds * 1000;
  }, [totalSeconds, key]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, (endRef.current - Date.now()) / 1000);
      setSecondsLeft(left);
      if (left <= 0) clearInterval(interval);
    };
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [running, key, totalSeconds]);

  return secondsLeft;
}
