import type { ContentIndex } from '@/content/loader';
import type { DifficultyChoice } from './difficulty';
import { mulberry32, shuffle } from './rng';

export const PAIRS_PER_BOARD = 6;

export interface PairCard {
  /** id único de la tarjeta en el tablero */
  uid: string;
  /** id de la pareja a la que pertenece */
  pairId: string;
  text: string;
  /** ítem SRS asociado (para registrar aciertos/fallos) */
  itemId: string;
  side: 'es' | 'match';
}

/** Parejas de los últimos tableros, para no repetirlas enseguida. */
const recentPairIds = new Set<string>();
const RECENT_LIMIT = PAIRS_PER_BOARD * 4;

function rememberBoard(pairIds: string[]): void {
  for (const id of pairIds) {
    recentPairIds.add(id);
  }
  while (recentPairIds.size > RECENT_LIMIT) {
    const oldest = recentPairIds.values().next().value;
    if (oldest === undefined) break;
    recentPairIds.delete(oldest);
  }
}

function preferUnseen<T extends { id: string }>(items: T[]): T[] {
  return [
    ...items.filter((i) => !recentPairIds.has(i.id)),
    ...items.filter((i) => recentPairIds.has(i.id)),
  ];
}

/**
 * Construye un tablero de parejas. Las parejas de los últimos tableros se
 * evitan mientras quede material nuevo.
 * Relajado/normal: palabra ↔ traducción alemana.
 * Difícil: modismo o palabra ↔ significado en español.
 */
export function buildPairsBoard(
  content: ContentIndex,
  difficulty: DifficultyChoice,
  seed = Date.now(),
): PairCard[] {
  const rng = mulberry32(seed >>> 0);
  const pairs: { pairId: string; es: string; match: string }[] = [];

  if (difficulty === 'dificil') {
    const idioms = preferUnseen(shuffle(rng, [...content.idioms.values()]));
    for (const idiom of idioms.slice(0, PAIRS_PER_BOARD)) {
      pairs.push({ pairId: idiom.id, es: idiom.phrase, match: shorten(idiom.meaningEs) });
    }
  }
  if (pairs.length < PAIRS_PER_BOARD) {
    const vocab = preferUnseen(
      shuffle(
        rng,
        [...content.vocab.values()].filter((v) => v.glossDe),
      ),
    );
    for (const item of vocab) {
      if (pairs.length >= PAIRS_PER_BOARD) break;
      const match = difficulty === 'dificil' ? shorten(item.definitionEs) : item.glossDe!;
      pairs.push({ pairId: item.id, es: item.lemma, match });
    }
  }

  rememberBoard(pairs.map((p) => p.pairId));

  const cards: PairCard[] = pairs.flatMap((p, i) => [
    { uid: `a-${i}`, pairId: p.pairId, text: p.es, itemId: p.pairId, side: 'es' as const },
    { uid: `b-${i}`, pairId: p.pairId, text: p.match, itemId: p.pairId, side: 'match' as const },
  ]);
  return shuffle(rng, cards);
}

function shorten(text: string, max = 60): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function pairsXp(matched: number, mistakes: number): number {
  return Math.max(10, matched * 6 - mistakes * 2);
}
