import { hashString, mulberry32 } from '../rng';
import { CARD_DEFS, CARD_PRICES, rollCardChoices, STARTER_DECK } from './cards';
import { ENEMY_DEFS } from './enemies';
import { RUN_EVENTS } from './events';
import { generateMap, nodeById } from './map';
import type { CardInstance, RunState, ShopOffer } from './types';

export const MAX_CONCENTRACION = 100;
export const FORGE_REMOVE_PRICE = 30;

export function createRun(seed?: number): RunState {
  const realSeed = seed ?? hashString(`${Date.now()}-${Math.random()}`);
  let uid = 0;
  const deck: CardInstance[] = STARTER_DECK.map((defId) => ({ uid: `card-${uid++}`, defId }));
  return {
    seed: realSeed,
    phase: 'mapa',
    map: generateMap(realSeed),
    currentNodeId: null,
    deck,
    concentracion: MAX_CONCENTRACION,
    maxConcentracion: MAX_CONCENTRACION,
    monedas: 40,
    combat: null,
    rewardCardIds: [],
    rewardCoins: 0,
    shopOffers: [],
    eventId: null,
    stats: { correct: 0, wrong: 0, bestCombo: 0, coinsEarned: 0 },
    nextUid: uid,
  };
}

export function addCardToDeck(run: RunState, defId: string): void {
  run.deck.push({ uid: `card-${run.nextUid++}`, defId });
}

/** Nodos seleccionables: capa 0 al empezar, o los `next` del nodo actual. */
export function selectableNodeIds(run: RunState): string[] {
  if (run.currentNodeId === null) return run.map.startIds;
  return nodeById(run.map, run.currentNodeId).next;
}

/** Recompensa de monedas tras un combate, determinista por nodo. */
export function coinRewardFor(run: RunState, nodeId: string): number {
  const node = nodeById(run.map, nodeId);
  const rng = mulberry32(run.seed + hashString(nodeId));
  if (node.type === 'jefe') return 60 + Math.floor(rng() * 20);
  if (node.type === 'elite') return 32 + Math.floor(rng() * 14);
  return 16 + Math.floor(rng() * 10);
}

export function rollRewardCards(run: RunState, nodeId: string): string[] {
  const node = nodeById(run.map, nodeId);
  const rng = mulberry32(run.seed + hashString(nodeId) + 1);
  return rollCardChoices(rng, 3, node.type !== 'combate');
}

export function rollShopOffers(run: RunState, nodeId: string): ShopOffer[] {
  const rng = mulberry32(run.seed + hashString(nodeId) + 2);
  return rollCardChoices(rng, 3, true).map((defId) => ({
    defId,
    price: CARD_PRICES[CARD_DEFS[defId].rarity],
    sold: false,
  }));
}

export function applyEventEffect(
  run: RunState,
  eventId: string,
  optionIndex: number,
): { gainedCardId?: string } {
  const option = RUN_EVENTS[eventId].options[optionIndex];
  switch (option.effect.kind) {
    case 'coins':
      run.monedas += option.effect.amount;
      run.stats.coinsEarned += option.effect.amount;
      return {};
    case 'heal':
      run.concentracion = Math.min(run.maxConcentracion, run.concentracion + option.effect.amount);
      return {};
    case 'card': {
      const rarity = option.effect.rarity;
      const rng = mulberry32(run.seed + hashString(eventId) + optionIndex);
      const pool = Object.values(CARD_DEFS).filter((c) => c.rarity === rarity);
      const def = pool[Math.floor(rng() * pool.length)];
      addCardToDeck(run, def.id);
      return { gainedCardId: def.id };
    }
    case 'nothing':
      return {};
  }
}

/** Fragmentos ganados al terminar un run (victoria o derrota). */
export function fragmentReward(run: RunState, victory: boolean): number {
  const visited = run.map.nodes.filter((n) => n.id === run.currentNodeId).length;
  const depth = run.currentNodeId ? nodeById(run.map, run.currentNodeId).layer + 1 : visited;
  const base = depth * 5 + run.stats.correct * 2;
  return victory ? base + 80 : base;
}

export function enemyForNode(run: RunState, nodeId: string): string {
  const node = nodeById(run.map, nodeId);
  if (!node.enemyId) throw new Error(`el nodo ${nodeId} no tiene enemigo`);
  return node.enemyId;
}

export { ENEMY_DEFS };
