import { describe, expect, it } from 'vitest';
import { combatReducer, createCombat, currentChallengeId, BASE_DAMAGE } from '@/game/run/combat';
import { STARTER_DECK } from '@/game/run/cards';
import type { CardInstance } from '@/game/run/types';

function deck(): CardInstance[] {
  return STARTER_DECK.map((defId, i) => ({ uid: `u${i}`, defId }));
}

const QUEUE = ['c-0001', 'c-0002', 'c-0003'];

describe('createCombat', () => {
  it('roba una mano inicial de 4 cartas, determinista por semilla', () => {
    const a = createCombat('subjuntivo-errante', deck(), QUEUE, 42);
    const b = createCombat('subjuntivo-errante', deck(), QUEUE, 42);
    expect(a.hand).toHaveLength(4);
    expect(a.hand.map((c) => c.defId)).toEqual(b.hand.map((c) => c.defId));
    expect(a.enemyHp).toBe(55);
  });
});

describe('combatReducer ANSWER', () => {
  it('acierto rápido sin cartas hace daño base por bono de velocidad', () => {
    const state = createCombat('subjuntivo-errante', deck(), QUEUE, 1);
    const { state: next, events } = combatReducer(state, {
      type: 'ANSWER',
      correct: true,
      secondsLeft: 20,
      totalSeconds: 20,
    });
    const hit = events.find((e) => e.type === 'HIT');
    expect(hit && 'damage' in hit && hit.damage).toBe(Math.round(BASE_DAMAGE * 1.5));
    expect(next.enemyHp).toBe(55 - Math.round(BASE_DAMAGE * 1.5));
    expect(next.comboStreak).toBe(1);
    expect(next.turn).toBe(2);
  });

  it('fallo rompe el combo y devuelve el ataque del enemigo', () => {
    let state = createCombat('subjuntivo-errante', deck(), QUEUE, 1);
    state = combatReducer(state, {
      type: 'ANSWER',
      correct: true,
      secondsLeft: 0,
      totalSeconds: 20,
    }).state;
    const result = combatReducer(state, {
      type: 'ANSWER',
      correct: false,
      secondsLeft: 0,
      totalSeconds: 20,
    });
    expect(result.playerDamage).toBe(9);
    expect(result.state.comboStreak).toBe(0);
    expect(result.events.some((e) => e.type === 'COMBO_BREAK')).toBe(true);
  });

  it('el combo multiplica el daño al llegar a 3 aciertos', () => {
    let state = createCombat('tejedor-conectores', deck(), QUEUE, 1);
    for (let i = 0; i < 2; i++) {
      state = combatReducer(state, {
        type: 'ANSWER',
        correct: true,
        secondsLeft: 0,
        totalSeconds: 20,
      }).state;
    }
    const result = combatReducer(state, {
      type: 'ANSWER',
      correct: true,
      secondsLeft: 0,
      totalSeconds: 20,
    });
    expect(result.events.some((e) => e.type === 'COMBO_UP')).toBe(true);
    const hit = result.events.find((e) => e.type === 'HIT');
    expect(hit && 'damage' in hit && hit.damage).toBe(15); // 10 × 1.5
  });

  it('la quimera se cura al fallar', () => {
    let state = createCombat('quimera-sinonimos', deck(), QUEUE, 1);
    state = combatReducer(state, {
      type: 'ANSWER',
      correct: true,
      secondsLeft: 0,
      totalSeconds: 20,
    }).state;
    const hpAfterHit = state.enemyHp;
    const result = combatReducer(state, {
      type: 'ANSWER',
      correct: false,
      secondsLeft: 0,
      totalSeconds: 20,
    });
    expect(result.state.enemyHp).toBe(Math.min(85, hpAfterHit + 6));
  });

  it('el jefe se enfurece bajo la mitad de vida', () => {
    const state = createCombat('academico', deck(), QUEUE, 1);
    state.enemyHp = 76;
    const result = combatReducer(state, {
      type: 'ANSWER',
      correct: true,
      secondsLeft: 20,
      totalSeconds: 20,
    });
    expect(result.state.enraged).toBe(true);
    expect(result.events.some((e) => e.type === 'ENEMY_ENRAGED')).toBe(true);
  });

  it('victoria al llegar el enemigo a 0 PV', () => {
    const state = createCombat('falso-amigo', deck(), QUEUE, 1);
    state.enemyHp = 5;
    const result = combatReducer(state, {
      type: 'ANSWER',
      correct: true,
      secondsLeft: 0,
      totalSeconds: 20,
    });
    expect(result.finished).toBe('victoria');
    expect(result.events.some((e) => e.type === 'ENEMY_DEFEATED')).toBe(true);
  });
});

describe('combatReducer PLAY_CARD', () => {
  it('aplica modificadores y respeta la energía', () => {
    const state = createCombat('subjuntivo-errante', deck(), QUEUE, 7);
    const card = state.hand[0];
    const result = combatReducer(state, { type: 'PLAY_CARD', uid: card.uid });
    expect(result.state.hand).toHaveLength(3);
    expect(result.state.energy).toBeLessThanOrEqual(3);
  });

  it('cambiar de reto avanza la cola', () => {
    const state = createCombat('subjuntivo-errante', deck(), QUEUE, 7);
    state.hand[0] = { uid: 'swap', defId: 'otra-pagina' };
    const before = currentChallengeId(state);
    const result = combatReducer(state, { type: 'PLAY_CARD', uid: 'swap' });
    expect(currentChallengeId(result.state)).not.toBe(before);
    expect(result.state.modifiers.damageMult).toBeCloseTo(1.25);
  });
});
