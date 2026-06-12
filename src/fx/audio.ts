/**
 * Motor de sonido sintetizado con WebAudio: cero assets, cero latencia de red,
 * funciona sin conexión. iOS exige un gesto del usuario para desbloquear el
 * contexto: `unlockAudio()` se engancha al primer pointerdown en main.tsx.
 */

type SfxName =
  | 'tap'
  | 'cardPlay'
  | 'cardDraw'
  | 'correct'
  | 'wrong'
  | 'comboUp'
  | 'coin'
  | 'hit'
  | 'enemyDown'
  | 'bossDown'
  | 'levelUp'
  | 'achievement'
  | 'star'
  | 'tick';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = ensureCtx();
  if (c && c.state === 'suspended') void c.resume();
}

export function setMuted(value: boolean): void {
  muted = value;
}

interface Tone {
  freq: number;
  /** desplazamiento de inicio en segundos */
  at?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** glissando hacia esta frecuencia */
  slideTo?: number;
}

function play(tones: Tone[]): void {
  if (muted) return;
  const c = ensureCtx();
  if (!c || !master || c.state !== 'running') return;
  const now = c.currentTime;
  for (const t of tones) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const start = now + (t.at ?? 0);
    const dur = t.dur ?? 0.12;
    osc.type = t.type ?? 'triangle';
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.slideTo) osc.frequency.exponentialRampToValueAtTime(t.slideTo, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(t.gain ?? 0.25, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }
}

function noise(dur: number, gain = 0.18, at = 0): void {
  if (muted) return;
  const c = ensureCtx();
  if (!c || !master || c.state !== 'running') return;
  const frames = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = gain;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  src.connect(filter).connect(g).connect(master);
  src.start(c.currentTime + at);
}

const SFX: Record<SfxName, () => void> = {
  tap: () => play([{ freq: 520, dur: 0.05, gain: 0.12, type: 'sine' }]),
  cardDraw: () => play([{ freq: 660, dur: 0.08, gain: 0.14, slideTo: 990, type: 'sine' }]),
  cardPlay: () =>
    play([
      { freq: 392, dur: 0.1, gain: 0.2 },
      { freq: 587, at: 0.06, dur: 0.12, gain: 0.18 },
    ]),
  correct: () =>
    play([
      { freq: 659, dur: 0.09, gain: 0.22 },
      { freq: 880, at: 0.07, dur: 0.12, gain: 0.22 },
      { freq: 1318, at: 0.14, dur: 0.16, gain: 0.18, type: 'sine' },
    ]),
  wrong: () => {
    play([
      { freq: 196, dur: 0.22, gain: 0.25, type: 'sawtooth', slideTo: 130 },
      { freq: 98, at: 0.02, dur: 0.25, gain: 0.2, type: 'square', slideTo: 65 },
    ]);
    noise(0.18, 0.1);
  },
  comboUp: () =>
    play([
      { freq: 523, dur: 0.07, gain: 0.2 },
      { freq: 659, at: 0.06, dur: 0.07, gain: 0.2 },
      { freq: 784, at: 0.12, dur: 0.07, gain: 0.2 },
      { freq: 1046, at: 0.18, dur: 0.18, gain: 0.22, type: 'sine' },
    ]),
  coin: () =>
    play([
      { freq: 988, dur: 0.06, gain: 0.18, type: 'square' },
      { freq: 1319, at: 0.05, dur: 0.14, gain: 0.16, type: 'square' },
    ]),
  hit: () => {
    play([{ freq: 220, dur: 0.1, gain: 0.28, type: 'square', slideTo: 110 }]);
    noise(0.1, 0.16);
  },
  enemyDown: () => {
    play([
      { freq: 440, dur: 0.12, gain: 0.22, slideTo: 220 },
      { freq: 880, at: 0.1, dur: 0.3, gain: 0.2, slideTo: 1760, type: 'sine' },
    ]);
    noise(0.35, 0.2, 0.05);
  },
  bossDown: () => {
    play([
      { freq: 523, dur: 0.15, gain: 0.25 },
      { freq: 659, at: 0.12, dur: 0.15, gain: 0.25 },
      { freq: 784, at: 0.24, dur: 0.15, gain: 0.25 },
      { freq: 1046, at: 0.36, dur: 0.4, gain: 0.28, type: 'sine' },
      { freq: 1568, at: 0.5, dur: 0.5, gain: 0.2, type: 'sine' },
    ]);
    noise(0.5, 0.22, 0.3);
  },
  levelUp: () =>
    play([
      { freq: 392, dur: 0.1, gain: 0.22 },
      { freq: 523, at: 0.09, dur: 0.1, gain: 0.22 },
      { freq: 659, at: 0.18, dur: 0.1, gain: 0.22 },
      { freq: 784, at: 0.27, dur: 0.28, gain: 0.26, type: 'sine' },
    ]),
  achievement: () =>
    play([
      { freq: 880, dur: 0.08, gain: 0.2, type: 'sine' },
      { freq: 1108, at: 0.08, dur: 0.08, gain: 0.2, type: 'sine' },
      { freq: 1318, at: 0.16, dur: 0.24, gain: 0.22, type: 'sine' },
    ]),
  star: () =>
    play([
      { freq: 1318, dur: 0.07, gain: 0.18, type: 'sine' },
      { freq: 1760, at: 0.05, dur: 0.18, gain: 0.2, type: 'sine' },
    ]),
  tick: () => play([{ freq: 1200, dur: 0.03, gain: 0.08, type: 'sine' }]),
};

export function sfx(name: SfxName): void {
  try {
    SFX[name]();
  } catch {
    /* el audio nunca debe romper el juego */
  }
}
