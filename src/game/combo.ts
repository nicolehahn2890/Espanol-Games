/** Multiplicador de combo compartido por todos los modos: ×1 → ×1.5 → ×2 → ×3. */
export const COMBO_TIERS = [
  { streak: 0, multiplier: 1 },
  { streak: 3, multiplier: 1.5 },
  { streak: 6, multiplier: 2 },
  { streak: 10, multiplier: 3 },
] as const;

export function comboMultiplier(streak: number): number {
  let multiplier = 1;
  for (const tier of COMBO_TIERS) {
    if (streak >= tier.streak) multiplier = tier.multiplier;
  }
  return multiplier;
}

/** ¿El acierto número `streak` acaba de subir de nivel de combo? */
export function isComboTierUp(streak: number): boolean {
  return COMBO_TIERS.some((tier) => tier.streak === streak && tier.streak > 0);
}

/** Bono de velocidad 1.0–1.5 según segundos restantes del temporizador. */
export function speedBonus(secondsLeft: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 1;
  const ratio = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  return 1 + ratio * 0.5;
}
