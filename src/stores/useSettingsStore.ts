import { create } from 'zustand';
import { setMuted } from '@/fx/audio';
import { setReducedMotion } from '@/fx/particles';
import { setShakeReducedMotion } from '@/fx/shake';
import { setCelebrateReducedMotion } from '@/fx/celebrate';

interface Settings {
  sound: boolean;
  reducedMotion: boolean;
  toggleSound: () => void;
  toggleReducedMotion: () => void;
}

const KEY = 'la-forja:settings';

function load(): { sound: boolean; reducedMotion: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* valores por defecto */
  }
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return { sound: true, reducedMotion: Boolean(prefersReduced) };
}

function apply(state: { sound: boolean; reducedMotion: boolean }): void {
  setMuted(!state.sound);
  setReducedMotion(state.reducedMotion);
  setShakeReducedMotion(state.reducedMotion);
  setCelebrateReducedMotion(state.reducedMotion);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sin persistencia */
  }
}

const initial = load();
apply(initial);

export const useSettingsStore = create<Settings>((set, get) => ({
  ...initial,
  toggleSound: () => {
    const next = { sound: !get().sound, reducedMotion: get().reducedMotion };
    apply(next);
    set(next);
  },
  toggleReducedMotion: () => {
    const next = { sound: get().sound, reducedMotion: !get().reducedMotion };
    apply(next);
    set(next);
  },
}));
