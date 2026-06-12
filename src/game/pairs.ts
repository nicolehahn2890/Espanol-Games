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

/**
 * Construye un tablero de parejas.
 * Relajado/normal: palabra ↔ traducción alemana.
 * Difícil: palabra ↔ definición monolingüe o modismo ↔ significado.
 */
export function buildPairsBoard(
  content: ContentIndex,
  difficulty: DifficultyChoice,
  seed = Date.now(),
): PairCard[] {
  const rng = mulberry32(seed >>> 0);
  const pairs: { pairId: string; es: string; match: string }[] = [];

  if (difficulty === 'dificil') {
    const idioms = shuffle(rng, [...content.idioms.values()]);
    for (const idiom of idioms.slice(0, PAIRS_PER_BOARD)) {
      pairs.push({ pairId: idiom.id, es: idiom.phrase, match: idiom.meaningEs });
    }
  }
  if (pairs.length < PAIRS_PER_BOARD) {
    const vocab = shuffle(
      rng,
      [...content.vocab.values()].filter((v) => v.glossDe),
    );
    for (const item of vocab) {
      if (pairs.length >= PAIRS_PER_BOARD) break;
      const match =
        difficulty === 'dificil' ? shorten(item.definitionEs) : item.glossDe!;
      pairs.push({ pairId: item.id, es: item.lemma, match });
    }
  }

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
