import confetti from 'canvas-confetti';

let reducedMotion = false;

export function setCelebrateReducedMotion(value: boolean): void {
  reducedMotion = value;
}

const FORGE_COLORS = ['#58cc02', '#1cb0f6', '#a560f8', '#ff9600', '#ffc800', '#ff86d0'];

/** Celebración pequeña: logro, subida de nivel, récord. */
export function celebrateSmall(): void {
  if (reducedMotion) return;
  void confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.7 },
    colors: FORGE_COLORS,
    disableForReducedMotion: true,
  });
}

/** Cañón doble para victorias de jefe. */
export function celebrateVictory(): void {
  if (reducedMotion) return;
  const opts = { colors: FORGE_COLORS, disableForReducedMotion: true };
  void confetti({ ...opts, particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } });
  void confetti({ ...opts, particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } });
  setTimeout(() => {
    void confetti({ ...opts, particleCount: 120, spread: 100, origin: { y: 0.4 } });
  }, 350);
}
