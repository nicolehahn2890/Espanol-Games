import { comboMultiplier } from './combo';

export const BLITZ_SECONDS = 90;

/** Puntos por un acierto en Contrarreloj. */
export function blitzPoints(streak: number, answerSeconds: number): number {
  const speed = answerSeconds <= 4 ? 1.5 : answerSeconds <= 8 ? 1.2 : 1;
  return Math.round(100 * comboMultiplier(streak) * speed);
}

/** XP otorgada al terminar una partida de Contrarreloj. */
export function blitzXp(correct: number, maxCombo: number): number {
  return correct * 6 + maxCombo * 4;
}
