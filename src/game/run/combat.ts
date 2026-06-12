import { mulberry32 } from '../rng';
import { comboMultiplier, isComboTierUp, speedBonus } from '../combo';
import { CARD_DEFS } from './cards';
import { ENEMY_DEFS } from './enemies';
import type { CardInstance, CombatEvent, CombatModifiers, CombatState } from './types';

export const HAND_SIZE = 4;
export const BASE_DAMAGE = 10;
export const CHALLENGE_SECONDS = 20;

function freshModifiers(): CombatModifiers {
  return {
    damageMult: 1,
    extraTimeSeconds: 0,
    revealLetters: 0,
    doubleEdge: false,
    comboShield: false,
    coinsOnHit: 0,
    combatDamageMult: 1,
  };
}

function draw(state: CombatState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) return;
      // rebaraja determinista con la semilla del combate y el turno
      const rng = mulberry32(state.seed + state.turn * 7919);
      const pile = [...state.discardPile];
      for (let j = pile.length - 1; j > 0; j--) {
        const k = Math.floor(rng() * (j + 1));
        [pile[j], pile[k]] = [pile[k], pile[j]];
      }
      state.drawPile = pile;
      state.discardPile = [];
    }
    const card = state.drawPile.pop();
    if (card) state.hand.push(card);
  }
}

export function createCombat(
  enemyId: string,
  deck: CardInstance[],
  challengeQueue: string[],
  seed: number,
): CombatState {
  const enemy = ENEMY_DEFS[enemyId];
  const rng = mulberry32(seed);
  const drawPile = [...deck];
  for (let i = drawPile.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [drawPile[i], drawPile[j]] = [drawPile[j], drawPile[i]];
  }
  const state: CombatState = {
    enemyId,
    enemyHp: enemy.hp,
    enemyMaxHp: enemy.hp,
    enraged: false,
    turn: 1,
    energy: 3,
    maxEnergy: 3,
    hand: [],
    drawPile,
    discardPile: [],
    modifiers: freshModifiers(),
    challengeQueue,
    challengeIndex: 0,
    comboStreak: 0,
    seed,
  };
  draw(state, HAND_SIZE);
  return state;
}

export type CombatAction =
  | { type: 'PLAY_CARD'; uid: string }
  | { type: 'ANSWER'; correct: boolean; secondsLeft: number; totalSeconds: number };

export interface CombatResult {
  state: CombatState;
  events: CombatEvent[];
  /** concentración perdida (la gestiona el RunState) */
  playerDamage: number;
  /** concentración recuperada por cartas */
  playerHeal: number;
  coinsGained: number;
  finished: 'victoria' | 'derrota-turno' | null;
}

export function currentChallengeId(state: CombatState): string {
  return state.challengeQueue[state.challengeIndex % state.challengeQueue.length];
}

/**
 * Reducer puro de combate. No toca React ni la base de datos: devuelve el
 * nuevo estado más los eventos que la capa visual convierte en espectáculo.
 */
export function combatReducer(prev: CombatState, action: CombatAction): CombatResult {
  const state: CombatState = structuredClone(prev);
  const events: CombatEvent[] = [];
  let playerDamage = 0;
  let playerHeal = 0;
  let coinsGained = 0;

  const enemy = ENEMY_DEFS[state.enemyId];

  if (action.type === 'PLAY_CARD') {
    const idx = state.hand.findIndex((c) => c.uid === action.uid);
    if (idx === -1) return { state: prev, events, playerDamage, playerHeal, coinsGained, finished: null };
    const card = state.hand[idx];
    const def = CARD_DEFS[card.defId];
    if (def.cost > state.energy) {
      return { state: prev, events, playerDamage, playerHeal, coinsGained, finished: null };
    }
    state.energy -= def.cost;
    state.hand.splice(idx, 1);
    state.discardPile.push(card);
    events.push({ type: 'CARD_PLAYED', cardUid: card.uid, defId: card.defId });

    const m = state.modifiers;
    switch (def.effect.kind) {
      case 'damage-mult':
        m.damageMult *= def.effect.mult;
        break;
      case 'extra-time':
        m.extraTimeSeconds += def.effect.seconds;
        break;
      case 'reveal-letter':
        m.revealLetters += 1;
        m.damageMult *= def.effect.damagePenalty;
        break;
      case 'heal':
        playerHeal += def.effect.amount;
        events.push({ type: 'HEAL', amount: def.effect.amount });
        break;
      case 'coins-on-hit':
        m.coinsOnHit += def.effect.amount;
        break;
      case 'double-edge':
        m.doubleEdge = true;
        m.damageMult *= def.effect.mult;
        break;
      case 'combo-shield':
        m.comboShield = true;
        break;
      case 'swap-challenge':
        state.challengeIndex += 1;
        m.damageMult *= def.effect.damageBonus;
        events.push({ type: 'CHALLENGE_SWAPPED' });
        break;
      case 'combat-damage-mult':
        m.combatDamageMult *= def.effect.mult;
        break;
    }
    return { state, events, playerDamage, playerHeal, coinsGained, finished: null };
  }

  // ANSWER: resuelve el reto del turno
  const m = state.modifiers;
  if (action.correct) {
    state.comboStreak += 1;
    const multiplier = comboMultiplier(state.comboStreak);
    if (isComboTierUp(state.comboStreak)) {
      events.push({ type: 'COMBO_UP', streak: state.comboStreak, multiplier });
    }
    const damage = Math.round(
      BASE_DAMAGE *
        speedBonus(action.secondsLeft, action.totalSeconds) *
        multiplier *
        m.damageMult *
        m.combatDamageMult,
    );
    state.enemyHp = Math.max(0, state.enemyHp - damage);
    events.push({ type: 'HIT', damage });
    if (m.coinsOnHit > 0) {
      coinsGained += m.coinsOnHit;
      events.push({ type: 'COINS', amount: m.coinsOnHit });
    }
  } else {
    if (m.comboShield) {
      events.push({ type: 'COMBO_SAVED' });
    } else if (state.comboStreak > 0) {
      state.comboStreak = 0;
      events.push({ type: 'COMBO_BREAK' });
    }
    let attack = enemy.attack;
    if (state.enraged) attack = Math.round(attack * 1.5);
    if (m.doubleEdge) attack *= 2;
    playerDamage = attack;
    events.push({ type: 'PLAYER_HIT', damage: attack });
    if (enemy.quirk === 'heal-on-miss' && state.enemyHp > 0) {
      state.enemyHp = Math.min(state.enemyMaxHp, state.enemyHp + 6);
      events.push({ type: 'ENEMY_HEALED', amount: 6 });
    }
  }

  // furia del jefe al cruzar la mitad de vida
  if (enemy.quirk === 'enrage' && !state.enraged && state.enemyHp <= state.enemyMaxHp / 2) {
    state.enraged = true;
    events.push({ type: 'ENEMY_ENRAGED' });
  }

  let finished: CombatResult['finished'] = null;
  if (state.enemyHp <= 0) {
    events.push({ type: 'ENEMY_DEFEATED' });
    finished = 'victoria';
  } else {
    // siguiente turno: refresca energía, descarta y roba mano nueva
    state.turn += 1;
    state.challengeIndex += 1;
    state.energy = state.maxEnergy;
    // las cartas efímeras de un turno se consumieron; los modificadores se reinician
    const combatMult = m.combatDamageMult;
    state.modifiers = freshModifiers();
    state.modifiers.combatDamageMult = combatMult;
    state.discardPile.push(...state.hand);
    state.hand = [];
    draw(state, HAND_SIZE);
  }

  return { state, events, playerDamage, playerHeal, coinsGained, finished };
}
