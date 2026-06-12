/** Curva de experiencia: xp acumulada necesaria para alcanzar el nivel n. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(80 * Math.pow(level - 1, 1.6));
}

export const MAX_LEVEL = 60;

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** Progreso 0–1 dentro del nivel actual. */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) return 1;
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return (xp - current) / (next - current);
}

const TITLES: [number, string][] = [
  [1, 'Curiosa'],
  [5, 'Aprendiz Brillante'],
  [10, 'Cazadora de Palabras'],
  [18, 'Estrella del Quiz'],
  [27, 'Artesana del Idioma'],
  [38, 'Casi Nativa'],
  [50, 'Maestra de Palabras'],
  [60, 'Leyenda del Español'],
];

export function titleForLevel(level: number): string {
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) {
    if (level >= min) title = t;
  }
  return title;
}
