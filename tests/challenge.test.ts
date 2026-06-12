import { describe, expect, it } from 'vitest';
import { isCorrectAnswer } from '@/components/challenges/ChallengeView';
import type { Challenge } from '@/content/schema';

const base: Challenge = {
  id: 'c-9999',
  type: 'cloze-typed',
  domain: 'subjuntivo',
  difficulty: 2,
  sentence: 'Ojalá {hubiera sabido} antes lo que sé ahora.',
  answer: 'hubiera sabido',
  acceptedAlt: ['hubiese sabido'],
  explanation: 'Pluscuamperfecto de subjuntivo tras «ojalá» para lo irrealizable en el pasado.',
};

describe('isCorrectAnswer', () => {
  it('acepta la respuesta exacta ignorando mayúsculas y espacios extra', () => {
    expect(isCorrectAnswer(base, 'hubiera sabido')).toBe(true);
    expect(isCorrectAnswer(base, '  Hubiera   Sabido ')).toBe(true);
  });

  it('acepta alternativas declaradas', () => {
    expect(isCorrectAnswer(base, 'hubiese sabido')).toBe(true);
  });

  it('rechaza respuestas sin tilde correcta o incorrectas', () => {
    expect(isCorrectAnswer(base, 'hubiera savido')).toBe(false);
    expect(isCorrectAnswer(base, 'supiera')).toBe(false);
  });
});
