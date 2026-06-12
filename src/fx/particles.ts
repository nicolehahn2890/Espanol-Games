/**
 * Emisor de partículas ligero sobre un único <canvas> fijo.
 * Usado para ráfagas al acertar, brasas de fondo y golpes.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

const MAX_PARTICLES = 120;
let particles: Particle[] = [];
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let rafId = 0;
let reducedMotion = false;

export function setReducedMotion(value: boolean): void {
  reducedMotion = value;
}

function ensureCanvas(): void {
  if (canvas) return;
  canvas = document.getElementById('particle-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  const resize = () => {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
}

function loop(): void {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles = particles.filter((p) => p.life < p.maxLife);
  for (const p of particles) {
    p.life += 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.985;
    const t = Math.max(0, 1 - p.life / p.maxLife);
    ctx.globalAlpha = t;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  rafId = particles.length > 0 ? requestAnimationFrame(loop) : 0;
}

function spawn(batch: Particle[]): void {
  ensureCanvas();
  if (!ctx) return;
  particles.push(...batch);
  if (particles.length > MAX_PARTICLES) particles = particles.slice(-MAX_PARTICLES);
  if (!rafId) rafId = requestAnimationFrame(loop);
}

const GOLD = ['#f2b441', '#f8d488', '#ffe9b8'];
const TEAL = ['#3dd6c3', '#8df0e4', '#d2fff8'];
const EMBER = ['#e5484d', '#ff7a5c', '#ffb199'];

export type BurstPalette = 'gold' | 'teal' | 'ember';

const PALETTES: Record<BurstPalette, string[]> = { gold: GOLD, teal: TEAL, ember: EMBER };

/** Ráfaga radial en coordenadas de pantalla (px). */
export function burst(x: number, y: number, palette: BurstPalette = 'gold', count = 18): void {
  if (reducedMotion) return;
  const colors = PALETTES[palette];
  const batch: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    batch.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 0,
      maxLife: 30 + Math.random() * 25,
      size: 2.5 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.12,
    });
  }
  spawn(batch);
}

/** Ráfaga desde el centro de un elemento del DOM. */
export function burstFromElement(
  el: Element | null,
  palette: BurstPalette = 'gold',
  count = 18,
): void {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2, palette, count);
}
