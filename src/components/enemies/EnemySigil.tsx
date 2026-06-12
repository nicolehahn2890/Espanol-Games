import { motion } from 'framer-motion';
import { hashString, mulberry32 } from '@/game/rng';
import type { EnemyDef } from '@/game/run/types';

/**
 * Sigilo SVG procedural: anillo rúnico + composición geométrica única por
 * enemigo (derivada de su id), teñida con su matiz característico.
 */
export function EnemySigil({ enemy, size = 84 }: { enemy: EnemyDef; size?: number }) {
  const rng = mulberry32(hashString(enemy.id));
  const hue = enemy.hue;
  const main = `hsl(${hue} 70% 62%)`;
  const dim = `hsl(${hue} 50% 40%)`;
  const glow = `hsl(${hue} 80% 65% / 0.5)`;

  // marcas rúnicas alrededor del anillo
  const ticks = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + rng() * 0.2;
    const r1 = 40;
    const r2 = 40 - (4 + rng() * 5);
    return {
      x1: 50 + Math.cos(angle) * r1,
      y1: 50 + Math.sin(angle) * r1,
      x2: 50 + Math.cos(angle) * r2,
      y2: 50 + Math.sin(angle) * r2,
    };
  });

  // polígono interior irregular único
  const sides = 5 + Math.floor(rng() * 3);
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2;
    const r = 12 + rng() * 14;
    return `${50 + Math.cos(angle) * r},${50 + Math.sin(angle) * r}`;
  }).join(' ');

  const spiral = rng() > 0.5;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{ filter: `drop-shadow(0 0 12px ${glow})`, flexShrink: 0 }}
    >
      <circle cx="50" cy="50" r="44" fill="none" stroke={dim} strokeWidth="2" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={dim} strokeWidth="0.8" opacity="0.7" />
      {ticks.map((t, i) => (
        <line key={i} {...t} stroke={main} strokeWidth="1.6" strokeLinecap="round" />
      ))}
      {spiral ? (
        <path
          d="M50 50 m0 -20 a20 20 0 1 1 -14 34 a14 14 0 1 1 10 -24 a8 8 0 1 0 -6 14"
          fill="none"
          stroke={main}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ) : (
        <polygon points={points} fill={`hsl(${hue} 70% 60% / 0.25)`} stroke={main} strokeWidth="2" />
      )}
      <circle cx="50" cy="50" r="3.4" fill={main} />
    </motion.svg>
  );
}
