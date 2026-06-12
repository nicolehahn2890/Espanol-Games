import { describe, expect, it } from 'vitest';
import { levelFromXp, levelProgress, titleForLevel, xpForLevel } from '@/game/xp';
import { mulberry32, hashString } from '@/game/rng';
import { dailySeed, isYesterday, todayKey } from '@/game/daily';
import { difficultyLevels } from '@/game/difficulty';
import { quizStars, quizXp } from '@/game/quiz';
import { groupsXp, isOneAway, matchGroup, nextPuzzle, shuffledWords } from '@/game/groups';
import type { GroupPuzzle } from '@/content/schema';

describe('xp', () => {
  it('la curva es monótona y arranca en 0', () => {
    expect(xpForLevel(1)).toBe(0);
    for (let n = 2; n <= 60; n++) {
      expect(xpForLevel(n)).toBeGreaterThan(xpForLevel(n - 1));
    }
  });

  it('nivel y progreso coherentes', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(10))).toBe(10);
    expect(levelProgress(0)).toBe(0);
    expect(titleForLevel(60)).toBe('Leyenda del Español');
  });
});

describe('rng', () => {
  it('mulberry32 es determinista y uniforme en [0,1)', () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    for (let i = 0; i < 100; i++) {
      const va = a();
      expect(va).toBe(b());
      expect(va).toBeGreaterThanOrEqual(0);
      expect(va).toBeLessThan(1);
    }
  });

  it('hashString es estable', () => {
    expect(hashString('hola')).toBe(hashString('hola'));
    expect(hashString('hola')).not.toBe(hashString('holb'));
  });
});

describe('daily', () => {
  it('misma fecha ⇒ misma semilla; fechas distintas ⇒ distinta', () => {
    expect(dailySeed('2026-06-12')).toBe(dailySeed('2026-06-12'));
    expect(dailySeed('2026-06-12')).not.toBe(dailySeed('2026-06-13'));
  });

  it('detecta el día anterior', () => {
    expect(isYesterday('2026-06-11', '2026-06-12')).toBe(true);
    expect(isYesterday('2026-06-10', '2026-06-12')).toBe(false);
    expect(isYesterday('2026-05-31', '2026-06-01')).toBe(true);
  });

  it('todayKey tiene formato AAAA-MM-DD', () => {
    expect(todayKey(new Date('2026-06-12T10:00:00'))).toBe('2026-06-12');
  });
});

describe('dificultad', () => {
  it('mapea elecciones a niveles de contenido', () => {
    expect(difficultyLevels('relajado')).toEqual([1]);
    expect(difficultyLevels('normal')).toEqual([1, 2]);
    expect(difficultyLevels('dificil')).toEqual([2, 3]);
  });
});

describe('quiz', () => {
  it('puntúa estrellas por porcentaje de aciertos', () => {
    expect(quizStars(10, 10)).toBe(3);
    expect(quizStars(8, 10)).toBe(2);
    expect(quizStars(5, 10)).toBe(1);
    expect(quizStars(4, 10)).toBe(0);
  });

  it('xp crece con aciertos y estrellas', () => {
    expect(quizXp(10, 3)).toBeGreaterThan(quizXp(5, 1));
  });
});

const PUZZLE: GroupPuzzle = {
  id: 'gr-0001',
  difficulty: 1,
  groups: [
    { label: 'A', explanation: 'a', words: ['uno', 'dos', 'tres', 'cuatro'] },
    { label: 'B', explanation: 'b', words: ['rojo', 'azul', 'verde', 'negro'] },
    { label: 'C', explanation: 'c', words: ['perro', 'gato', 'pez', 'ave'] },
    { label: 'D', explanation: 'd', words: ['sol', 'luna', 'mar', 'cielo'] },
  ],
};

describe('grupos', () => {
  it('reconoce un grupo completo sin importar mayúsculas', () => {
    expect(matchGroup(PUZZLE, ['Rojo', 'azul', 'VERDE', 'negro'])).toBe(1);
    expect(matchGroup(PUZZLE, ['rojo', 'azul', 'verde', 'sol'])).toBeNull();
  });

  it('detecta «a una de distancia»', () => {
    expect(isOneAway(PUZZLE, ['rojo', 'azul', 'verde', 'sol'])).toBe(true);
    expect(isOneAway(PUZZLE, ['rojo', 'azul', 'perro', 'sol'])).toBe(false);
  });

  it('baraja 16 palabras de forma determinista', () => {
    const a = shuffledWords(PUZZLE);
    expect(a).toHaveLength(16);
    expect(new Set(a).size).toBe(16);
    expect(shuffledWords(PUZZLE)).toEqual(a);
  });

  it('elige el siguiente sin resolver según dificultad', () => {
    const second: GroupPuzzle = { ...PUZZLE, id: 'gr-0002' };
    expect(nextPuzzle([PUZZLE, second], ['gr-0001'], 'relajado')?.id).toBe('gr-0002');
    expect(nextPuzzle([PUZZLE, second], [], 'relajado')?.id).toBe('gr-0001');
  });

  it('xp premia resolver sin errores', () => {
    expect(groupsXp(4, 0, true)).toBeGreaterThan(groupsXp(4, 3, true));
    expect(groupsXp(2, 4, false)).toBeGreaterThan(0);
  });
});
