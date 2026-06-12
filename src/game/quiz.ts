import type { Challenge, Domain } from '@/content/schema';
import { srsItemId } from '@/content/schema';
import type { ContentIndex } from '@/content/loader';
import { getDueQueue } from '@/srs/fsrs';
import { shuffle, mulberry32 } from './rng';
import type { DifficultyChoice } from './difficulty';
import { difficultyLevels } from './difficulty';

export const QUIZ_LENGTH = 10;

export type QuizCategory = 'mixta' | 'vocabulario' | 'gramatica' | 'falsos-amigos' | 'modismos';

export const QUIZ_CATEGORIES: { id: QuizCategory; emoji: string; label: string }[] = [
  { id: 'mixta', emoji: '🎲', label: 'Mixta' },
  { id: 'vocabulario', emoji: '📚', label: 'Vocabulario' },
  { id: 'gramatica', emoji: '🧩', label: 'Gramática' },
  { id: 'falsos-amigos', emoji: '🎭', label: 'Falsos amigos' },
  { id: 'modismos', emoji: '🦜', label: 'Modismos' },
];

const CATEGORY_DOMAINS: Record<Exclude<QuizCategory, 'mixta'>, Domain[]> = {
  vocabulario: ['vocab-c1', 'vocab-c2', 'sinonimos', 'colocaciones'],
  gramatica: ['subjuntivo', 'pasados', 'conectores', 'registro', 'ser-estar', 'preposiciones', 'se-construcciones'],
  'falsos-amigos': ['falsos-amigos'],
  modismos: ['modismos'],
};

/** Solo retos de elección: en los minijuegos nunca hay que teclear. */
function isChoice(challenge: Challenge): boolean {
  return challenge.type !== 'cloze-typed' && challenge.type !== 'error-spot';
}

/**
 * Selecciona los retos de una ronda: filtra por categoría y dificultad y
 * prioriza lo que el planificador FSRS marca como urgente.
 */
export async function buildQuizRound(
  content: ContentIndex,
  category: QuizCategory,
  difficulty: DifficultyChoice,
  length = QUIZ_LENGTH,
): Promise<Challenge[]> {
  const levels = difficultyLevels(difficulty);
  let pool = [...content.challenges.values()].filter(
    (c) => isChoice(c) && levels.includes(c.difficulty),
  );
  if (category !== 'mixta') {
    const domains = new Set(CATEGORY_DOMAINS[category]);
    pool = pool.filter((c) => domains.has(c.domain));
  }
  // respaldo: si el filtro deja muy poco, relaja la dificultad
  if (pool.length < length) {
    pool = [...content.challenges.values()].filter(
      (c) =>
        isChoice(c) &&
        (category === 'mixta' || new Set(CATEGORY_DOMAINS[category]).has(c.domain)),
    );
  }
  const ranking = await getDueQueue(pool.map((c) => srsItemId(c)));
  const order = new Map(ranking.map((r, i) => [r.itemId, i]));
  const sorted = [...pool].sort(
    (a, b) => (order.get(srsItemId(a)) ?? 999) - (order.get(srsItemId(b)) ?? 999),
  );
  // un poco de variedad entre lo más urgente
  const top = sorted.slice(0, Math.min(sorted.length, length * 2));
  return shuffle(mulberry32(Date.now() >>> 0), top).slice(0, length);
}

/** Estrellas al terminar la ronda (0–3). */
export function quizStars(correct: number, total: number): number {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio === 1) return 3;
  if (ratio >= 0.8) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

export function quizXp(correct: number, stars: number): number {
  return correct * 8 + stars * 15;
}
