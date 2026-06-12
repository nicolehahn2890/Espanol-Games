import { describe, expect, it } from 'vitest';
import { generatedChallenges } from '@/game/exercises';
import type { ContentIndex } from '@/content/loader';
import type { IdiomItem, VocabItem } from '@/content/schema';

function fakeContent(): ContentIndex {
  const vocab: VocabItem[] = Array.from({ length: 8 }, (_, i) => ({
    id: `v-9${i}00`,
    lemma: `palabra${i}`,
    pos: 'sust',
    definitionEs: `definición número ${i}`,
    glossDe: `Wort${i}`,
    domain: i % 2 === 0 ? 'vocab-c1' : 'vocab-c2',
    examples: [`Esta frase usa palabra${i} en contexto.`],
  }));
  const idioms: IdiomItem[] = Array.from({ length: 4 }, (_, i) => ({
    id: `i-9${i}00`,
    phrase: `modismo ${i}`,
    meaningEs: `significado del modismo ${i}`,
    example: `Ejemplo del modismo ${i}.`,
    register: 'neutro',
  }));
  return {
    challenges: new Map(),
    vocab: new Map(vocab.map((v) => [v.id, v])),
    idioms: new Map(idioms.map((i) => [i.id, i])),
    collocations: new Map(),
    grammarTopics: [],
    wordleWords: [],
    groupPuzzles: [],
    byDomain: new Map(),
  };
}

describe('ejercicios generados', () => {
  const generated = generatedChallenges(fakeContent());

  it('genera varias formas por palabra (def, de→es, es→de, ejemplo) y por modismo', () => {
    // 8 vocab × 4 formas + 4 modismos
    expect(generated.length).toBe(8 * 4 + 4);
  });

  it('cada reto tiene un hueco que coincide con la respuesta y ≥2 distractores', () => {
    for (const c of generated) {
      const gap = c.sentence.match(/\{([^}]+)\}/)?.[1];
      expect(gap).toBe(c.answer);
      expect(c.distractors!.length).toBeGreaterThanOrEqual(2);
      expect(c.distractors).not.toContain(c.answer);
      expect(c.itemRef).toBeTruthy();
    }
  });

  it('los ids son únicos y deterministas', () => {
    const ids = generated.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
