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
  [1, 'Aprendiz de la Fragua'],
  [5, 'Chispa Tenaz'],
  [10, 'Forjadora de Palabras'],
  [18, 'Temple de Acero'],
  [27, 'Artesana del Idioma'],
  [38, 'Maestra del Yunque'],
  [50, 'Guardiana de la Forja'],
  [60, 'Maestra Forjadora'],
];

export function titleForLevel(level: number): string {
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) {
    if (level >= min) title = t;
  }
  return title;
}
