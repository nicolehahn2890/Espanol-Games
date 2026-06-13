import type { WordleWord } from '@/content/schema';
import { dailySeed, todayKey } from './daily';
import { mulberry32 } from './rng';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type CellState = 'exact' | 'present' | 'absent';

/** Normaliza para comparar: mayúsculas, sin tildes, conservando la Ñ. */
export function normalizeWord(input: string): string {
  return input.toUpperCase().normalize('NFD').replace(/[̀́̂̈]/g, '').normalize('NFC');
}

/**
 * Evalúa un intento al estilo Wordle con manejo correcto de letras repetidas:
 * primero se marcan los aciertos exactos, luego las presentes restantes.
 */
export function evaluateGuess(guess: string, target: string): CellState[] {
  const g = normalizeWord(guess).split('');
  const t = normalizeWord(target).split('');
  const states: CellState[] = Array(g.length).fill('absent');
  const remaining = new Map<string, number>();

  for (let i = 0; i < g.length; i++) {
    if (g[i] === t[i]) {
      states[i] = 'exact';
    } else {
      remaining.set(t[i], (remaining.get(t[i]) ?? 0) + 1);
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (states[i] === 'exact') continue;
    const left = remaining.get(g[i]) ?? 0;
    if (left > 0) {
      states[i] = 'present';
      remaining.set(g[i], left - 1);
    }
  }
  return states;
}

/** Mejor estado por letra para colorear el teclado. */
export function keyboardStates(guesses: string[], target: string): Map<string, CellState> {
  const rank: Record<CellState, number> = { absent: 0, present: 1, exact: 2 };
  const map = new Map<string, CellState>();
  for (const guess of guesses) {
    const states = evaluateGuess(guess, target);
    const letters = normalizeWord(guess).split('');
    letters.forEach((letter, i) => {
      const prev = map.get(letter);
      if (!prev || rank[states[i]] > rank[prev]) map.set(letter, states[i]);
    });
  }
  return map;
}

/**
 * Palabra del día, determinista por fecha. Se limita a dificultad 1–2:
 * las joyas literarias quedan para la práctica en modo difícil.
 */
export function dailyWord(words: WordleWord[], dateKey = todayKey()): WordleWord {
  const pool = words.filter((w) => w.difficulty <= 2);
  const source = pool.length > 0 ? pool : words;
  const index = dailySeed(dateKey, 'palabra') % source.length;
  return source[index];
}

/** Palabras de las últimas prácticas, para no repetirlas enseguida. */
const recentWords = new Set<string>();
const RECENT_WORD_LIMIT = 25;

/** Palabra aleatoria para práctica libre, filtrada por dificultad. */
export function randomWord(
  words: WordleWord[],
  levels: (1 | 2 | 3)[],
  seed = Date.now(),
): WordleWord {
  const rng = mulberry32(seed >>> 0);
  const byLevel = words.filter((w) => levels.includes(w.difficulty));
  const pool = byLevel.length > 0 ? byLevel : words;
  const unseen = pool.filter((w) => !recentWords.has(w.id));
  const source = unseen.length > 0 ? unseen : pool;
  const chosen = source[Math.floor(rng() * source.length)];
  recentWords.add(chosen.id);
  while (recentWords.size > RECENT_WORD_LIMIT) {
    const oldest = recentWords.values().next().value;
    if (oldest === undefined) break;
    recentWords.delete(oldest);
  }
  return chosen;
}
