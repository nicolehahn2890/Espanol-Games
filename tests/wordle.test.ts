import { describe, expect, it } from 'vitest';
import {
  dailyWord,
  evaluateGuess,
  keyboardStates,
  normalizeWord,
  randomWord,
} from '@/game/wordle';
import type { WordleWord } from '@/content/schema';

const WORDS: WordleWord[] = [
  { id: 'w-0001', word: 'TERCO', display: 'terco', definitionEs: 'obstinado', difficulty: 2 },
  { id: 'w-0002', word: 'BALON', display: 'balón', definitionEs: 'pelota grande', difficulty: 1 },
  { id: 'w-0003', word: 'ÑOÑOS', display: 'ñoños', definitionEs: 'sosos', difficulty: 3 },
];

describe('normalizeWord', () => {
  it('quita tildes pero conserva la Ñ', () => {
    expect(normalizeWord('balón')).toBe('BALON');
    expect(normalizeWord('ñoño')).toBe('ÑOÑO');
    expect(normalizeWord('Güiro')).toBe('GUIRO');
  });
});

describe('evaluateGuess', () => {
  it('marca exactas, presentes y ausentes', () => {
    expect(evaluateGuess('TERCO', 'TERCO')).toEqual([
      'exact',
      'exact',
      'exact',
      'exact',
      'exact',
    ]);
    expect(evaluateGuess('CORTE', 'TERCO')).toEqual([
      'present',
      'present',
      'exact',
      'present',
      'present',
    ]);
  });

  it('maneja letras repetidas como Wordle', () => {
    // target tiene una sola L: solo una L del intento puede contar
    const states = evaluateGuess('LLAVE', 'BALON');
    expect(states[0]).toBe('present');
    expect(states[1]).toBe('absent');
  });

  it('compara ignorando tildes del intento', () => {
    expect(evaluateGuess('balón', 'BALON')).toEqual([
      'exact',
      'exact',
      'exact',
      'exact',
      'exact',
    ]);
  });
});

describe('keyboardStates', () => {
  it('se queda con el mejor estado por letra', () => {
    const map = keyboardStates(['CORTE', 'TERCO'], 'TERCO');
    expect(map.get('T')).toBe('exact');
    expect(map.get('E')).toBe('exact');
  });
});

describe('selección de palabra', () => {
  it('la palabra del día es determinista por fecha', () => {
    expect(dailyWord(WORDS, '2026-06-12')).toEqual(dailyWord(WORDS, '2026-06-12'));
  });

  it('práctica filtra por dificultad con respaldo', () => {
    expect(randomWord(WORDS, [1], 7).difficulty).toBe(1);
    expect(randomWord(WORDS, [2], 7).difficulty).toBe(2);
  });
});
