import type { Domain } from '@/content/schema';

export type Rarity = 'comun' | 'rara' | 'epica' | 'legendaria';

export interface CardDef {
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  description: string;
  effect: CardEffect;
}

export type CardEffect =
  | { kind: 'damage-mult'; mult: number }
  | { kind: 'extra-time'; seconds: number }
  | { kind: 'reveal-letter'; damagePenalty: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'coins-on-hit'; amount: number }
  | { kind: 'double-edge'; mult: number }
  | { kind: 'combo-shield' }
  | { kind: 'swap-challenge'; damageBonus: number }
  | { kind: 'combat-damage-mult'; mult: number };

/** Carta concreta dentro del mazo de un run. */
export interface CardInstance {
  uid: string;
  defId: string;
}

export type QuirkId = 'heal-on-miss' | 'enrage' | null;

export interface EnemyDef {
  id: string;
  name: string;
  epithet: string;
  hp: number;
  attack: number;
  domains: Domain[];
  quirk: QuirkId;
  quirkText?: string;
  tier: 'normal' | 'elite' | 'jefe';
  /** matiz de color del sigilo (grados HSL) */
  hue: number;
}

export type NodeType = 'combate' | 'elite' | 'mercader' | 'fragua' | 'evento' | 'jefe';

export interface MapNode {
  id: string;
  type: NodeType;
  layer: number;
  /** ids de nodos alcanzables desde este */
  next: string[];
  enemyId?: string;
  eventId?: string;
}

export interface RunMap {
  nodes: MapNode[];
  startIds: string[];
}

export interface CombatModifiers {
  damageMult: number;
  extraTimeSeconds: number;
  revealLetters: number;
  doubleEdge: boolean;
  comboShield: boolean;
  coinsOnHit: number;
  combatDamageMult: number;
}

export interface CombatState {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enraged: boolean;
  turn: number;
  energy: number;
  maxEnergy: number;
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  modifiers: CombatModifiers;
  challengeQueue: string[];
  challengeIndex: number;
  comboStreak: number;
  seed: number;
}

export type CombatEvent =
  | { type: 'CARD_PLAYED'; cardUid: string; defId: string }
  | { type: 'HIT'; damage: number }
  | { type: 'PLAYER_HIT'; damage: number }
  | { type: 'COMBO_UP'; streak: number; multiplier: number }
  | { type: 'COMBO_BREAK' }
  | { type: 'COMBO_SAVED' }
  | { type: 'COINS'; amount: number }
  | { type: 'HEAL'; amount: number }
  | { type: 'ENEMY_HEALED'; amount: number }
  | { type: 'ENEMY_ENRAGED' }
  | { type: 'CHALLENGE_SWAPPED' }
  | { type: 'ENEMY_DEFEATED' }
  | { type: 'PLAYER_DEFEATED' };

export type RunPhase =
  | 'mapa'
  | 'combate'
  | 'recompensa'
  | 'mercader'
  | 'fragua'
  | 'evento'
  | 'victoria'
  | 'derrota';

export interface ShopOffer {
  defId: string;
  price: number;
  sold: boolean;
}

export interface RunState {
  seed: number;
  phase: RunPhase;
  map: RunMap;
  currentNodeId: string | null;
  deck: CardInstance[];
  concentracion: number;
  maxConcentracion: number;
  monedas: number;
  combat: CombatState | null;
  /** ofertas de cartas tras un combate */
  rewardCardIds: string[];
  rewardCoins: number;
  shopOffers: ShopOffer[];
  eventId: string | null;
  stats: { correct: number; wrong: number; bestCombo: number; coinsEarned: number };
  nextUid: number;
}
