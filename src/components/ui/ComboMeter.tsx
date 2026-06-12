import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { comboMultiplier } from '@/game/combo';

export function ComboMeter({ streak }: { streak: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mult = comboMultiplier(streak);

  useEffect(() => {
    if (streak > 0 && ref.current) {
      gsap.fromTo(
        ref.current,
        { scale: 1.35 },
        { scale: 1, duration: 0.35, ease: 'back.out(3)' },
      );
    }
  }, [streak]);

  return (
    <span className={`combo-meter ${streak >= 3 ? 'active' : ''}`}>
      <span className="combo-mult" ref={ref}>
        ×{mult}
      </span>
      {streak > 0 && <span className="combo-streak">{streak} seguidas</span>}
    </span>
  );
}
