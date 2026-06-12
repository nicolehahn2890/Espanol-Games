import type { Challenge, IdiomItem, VocabItem } from '@/content/schema';
import type { ContentIndex } from '@/content/loader';
import { hashString, mulberry32, shuffle, type Rng } from './rng';

/**
 * Ejercicios generados automáticamente a partir del vocabulario y los
 * modismos existentes. Multiplican la variedad del quiz sin necesidad de
 * redactar contenido nuevo: cada palabra produce varias formas de ejercicio
 * y todas comparten el mismo ítem FSRS (itemRef) que sus retos curados.
 */

function vocabDifficulty(item: VocabItem): 1 | 2 {
  return item.domain === 'vocab-c2' ? 2 : 1;
}

function shorten(text: string, max = 70): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/** Distractores de la misma categoría gramatical (o cualquiera si faltan). */
function pickDistractors<T>(
  rng: Rng,
  all: T[],
  self: T,
  text: (t: T) => string,
  similar: (t: T) => boolean,
  count = 3,
): string[] {
  const selfText = text(self).toLowerCase();
  const pool = shuffle(
    rng,
    all.filter((t) => t !== self && text(t).toLowerCase() !== selfText),
  );
  const preferred = pool.filter(similar);
  const chosen: string[] = [];
  for (const source of [preferred, pool]) {
    for (const t of source) {
      const candidate = text(t);
      if (chosen.length >= count) break;
      if (!chosen.some((c) => c.toLowerCase() === candidate.toLowerCase())) {
        chosen.push(candidate);
      }
    }
    if (chosen.length >= count) break;
  }
  return chosen;
}

function vocabChallenges(vocab: VocabItem[]): Challenge[] {
  const out: Challenge[] = [];
  for (const item of vocab) {
    const rng = mulberry32(hashString(`gen:${item.id}`));
    const difficulty = vocabDifficulty(item);
    const samePos = (v: VocabItem) => v.pos === item.pos;

    // 1) definición → palabra
    out.push({
      id: `gen-def-${item.id}`,
      type: 'cloze-choice',
      domain: item.domain,
      difficulty,
      sentence: `La palabra que significa «${shorten(item.definitionEs)}» es {${item.lemma}}.`,
      answer: item.lemma,
      distractors: pickDistractors(rng, vocab, item, (v) => v.lemma, samePos),
      explanation: item.examples[0]
        ? `Ejemplo: ${item.examples[0]}`
        : `«${item.lemma}»: ${item.definitionEs}`,
      itemRef: item.id,
      source: 'curado',
    });

    // 2) español → alemán
    if (item.glossDe) {
      out.push({
        id: `gen-de-${item.id}`,
        type: 'cloze-choice',
        domain: item.domain,
        difficulty,
        sentence: `En alemán, «${item.lemma}» se dice {${item.glossDe}}.`,
        answer: item.glossDe,
        distractors: pickDistractors(
          rng,
          vocab.filter((v) => v.glossDe),
          item,
          (v) => v.glossDe!,
          samePos,
        ),
        explanation: `«${item.lemma}»: ${item.definitionEs}`,
        itemRef: item.id,
        source: 'curado',
      });

      // 3) alemán → español
      out.push({
        id: `gen-es-${item.id}`,
        type: 'cloze-choice',
        domain: item.domain,
        difficulty,
        sentence: `La palabra española para «${item.glossDe}» es {${item.lemma}}.`,
        answer: item.lemma,
        distractors: pickDistractors(rng, vocab, item, (v) => v.lemma, samePos),
        explanation: `«${item.lemma}»: ${item.definitionEs}`,
        itemRef: item.id,
        source: 'curado',
      });
    }

    // 4) hueco en una frase de ejemplo real (si contiene el lema exacto)
    const example = item.examples.find((e) =>
      new RegExp(`\\b${item.lemma}\\b`, 'i').test(e),
    );
    if (example) {
      const gapped = example.replace(
        new RegExp(`\\b${item.lemma}\\b`, 'i'),
        `{${item.lemma}}`,
      );
      out.push({
        id: `gen-ej-${item.id}`,
        type: 'cloze-choice',
        domain: item.domain,
        difficulty,
        sentence: gapped,
        answer: item.lemma,
        distractors: pickDistractors(rng, vocab, item, (v) => v.lemma, samePos),
        explanation: `«${item.lemma}»: ${item.definitionEs}`,
        itemRef: item.id,
        source: 'curado',
      });
    }
  }
  return out;
}

function idiomChallenges(idioms: IdiomItem[]): Challenge[] {
  return idioms.map((idiom) => {
    const rng = mulberry32(hashString(`gen:${idiom.id}`));
    return {
      id: `gen-mod-${idiom.id}`,
      type: 'nuance-choice',
      domain: 'modismos',
      difficulty: 2,
      sentence: `«${idiom.phrase}» significa {${shorten(idiom.meaningEs, 55)}}.`,
      answer: shorten(idiom.meaningEs, 55),
      distractors: pickDistractors(
        rng,
        idioms,
        idiom,
        (i) => shorten(i.meaningEs, 55),
        () => true,
      ),
      explanation: `Ejemplo: ${idiom.example}`,
      itemRef: idiom.id,
      source: 'curado',
    } satisfies Challenge;
  });
}

let cache: Challenge[] | null = null;

/** Genera (y memoriza) todos los ejercicios sintéticos del índice. */
export function generatedChallenges(content: ContentIndex): Challenge[] {
  if (cache) return cache;
  cache = [
    ...vocabChallenges([...content.vocab.values()]),
    ...idiomChallenges([...content.idioms.values()]),
  ];
  return cache;
}
