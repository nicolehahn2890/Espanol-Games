import type { Challenge, Domain } from '@/content/schema';
import { srsItemId } from '@/content/schema';
import type { ContentIndex } from '@/content/loader';
import { db } from '@/db/db';
import { retrievabilityOf } from '@/srs/fsrs';
import { generatedChallenges } from './exercises';
import { shuffle, mulberry32 } from './rng';
import type { DifficultyChoice } from './difficulty';
import { difficultyLevels } from './difficulty';

export const QUIZ_LENGTH = 10;

/** Lo visto hace menos de esto no vuelve a salir salvo que no quede otra. */
const RECENT_MS = 30 * 60 * 1000;

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

function filterPool(
  content: ContentIndex,
  category: QuizCategory,
  levels: (1 | 2 | 3)[] | null,
): Challenge[] {
  const all = [...content.challenges.values(), ...generatedChallenges(content)];
  const domains = category === 'mixta' ? null : new Set(CATEGORY_DOMAINS[category]);
  return all.filter(
    (c) =>
      isChoice(c) &&
      (domains === null || domains.has(c.domain)) &&
      (levels === null || levels.includes(c.difficulty)),
  );
}

/**
 * Selecciona los retos de una ronda.
 *
 * - Agrupa todas las variantes de ejercicio por su ítem FSRS, de modo que
 *   una misma palabra nunca aparece dos veces en la misma ronda y cada vez
 *   puede salir con una forma de ejercicio distinta.
 * - Prioriza: pendiente de repaso → nunca visto → ya dominado; lo visto en
 *   la última media hora va al final para que repetir una categoría no
 *   repita las mismas preguntas.
 */
export async function buildQuizRound(
  content: ContentIndex,
  category: QuizCategory,
  difficulty: DifficultyChoice,
  length = QUIZ_LENGTH,
): Promise<Challenge[]> {
  let pool = filterPool(content, category, difficultyLevels(difficulty));
  if (pool.length < length) pool = filterPool(content, category, null);

  const variants = new Map<string, Challenge[]>();
  for (const challenge of pool) {
    const key = srsItemId(challenge);
    const list = variants.get(key) ?? [];
    list.push(challenge);
    variants.set(key, list);
  }
  const itemIds = [...variants.keys()];
  const records = await db.srs.bulkGet(itemIds);
  const now = new Date();

  const due: string[] = [];
  const fresh: string[] = [];
  const known: string[] = [];
  const recent: string[] = [];
  itemIds.forEach((id, i) => {
    const record = records[i];
    if (!record) {
      fresh.push(id);
      return;
    }
    const lastReview = record.card.last_review ? Date.parse(record.card.last_review) : 0;
    if (now.getTime() - lastReview < RECENT_MS) {
      recent.push(id);
    } else if (retrievabilityOf(record, now) < 0.9) {
      due.push(id);
    } else {
      known.push(id);
    }
  });

  const rng = mulberry32(Date.now() >>> 0);
  const dueShuffled = shuffle(rng, due);
  const dueFirst = dueShuffled.slice(0, Math.ceil(length * 0.6));
  const dueRest = dueShuffled.slice(dueFirst.length);
  const order = [
    ...dueFirst,
    ...shuffle(rng, fresh),
    ...dueRest,
    ...shuffle(rng, known),
    ...shuffle(rng, recent),
  ];

  const round = order.slice(0, length).map((id) => {
    const options = variants.get(id)!;
    return options[Math.floor(rng() * options.length)];
  });
  return shuffle(rng, round);
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
