import type { CardDef, Rarity } from './types';
import { type Rng } from '../rng';

export const CARD_DEFS: Record<string, CardDef> = Object.fromEntries(
  (
    [
      {
        id: 'pluma-afilada',
        name: 'Pluma Afilada',
        rarity: 'comun',
        cost: 1,
        description: '+50 % de daño en tu próximo acierto.',
        effect: { kind: 'damage-mult', mult: 1.5 },
      },
      {
        id: 'reloj-de-arena',
        name: 'Reloj de Arena',
        rarity: 'comun',
        cost: 1,
        description: '+8 segundos al temporizador de este reto.',
        effect: { kind: 'extra-time', seconds: 8 },
      },
      {
        id: 'lupa',
        name: 'Lupa',
        rarity: 'comun',
        cost: 1,
        description: 'Revela la primera letra de la respuesta. Daño −25 %.',
        effect: { kind: 'reveal-letter', damagePenalty: 0.75 },
      },
      {
        id: 'balsamo',
        name: 'Bálsamo de Tinta',
        rarity: 'comun',
        cost: 1,
        description: 'Recupera 12 de concentración.',
        effect: { kind: 'heal', amount: 12 },
      },
      {
        id: 'moneda-falsa',
        name: 'Moneda Falsa',
        rarity: 'comun',
        cost: 0,
        description: 'Si aciertas este reto, ganas 6 monedas.',
        effect: { kind: 'coins-on-hit', amount: 6 },
      },
      {
        id: 'martillo',
        name: 'Martillo del Yunque',
        rarity: 'comun',
        cost: 1,
        description: '+30 % de daño en tu próximo acierto.',
        effect: { kind: 'damage-mult', mult: 1.3 },
      },
      {
        id: 'doble-filo',
        name: 'Doble Filo',
        rarity: 'rara',
        cost: 1,
        description: 'Daño ×2 si aciertas… y daño recibido ×2 si fallas.',
        effect: { kind: 'double-edge', mult: 2 },
      },
      {
        id: 'otra-pagina',
        name: 'Otra Página',
        rarity: 'rara',
        cost: 0,
        description: 'Cambia el reto actual por otro. +25 % de daño.',
        effect: { kind: 'swap-challenge', damageBonus: 1.25 },
      },
      {
        id: 'filo-arcano',
        name: 'Filo Arcano',
        rarity: 'epica',
        cost: 2,
        description: '+100 % de daño en tu próximo acierto.',
        effect: { kind: 'damage-mult', mult: 2 },
      },
      {
        id: 'racha-dorada',
        name: 'Racha Dorada',
        rarity: 'epica',
        cost: 2,
        description: 'Tu combo no se romperá con el próximo fallo.',
        effect: { kind: 'combo-shield' },
      },
      {
        id: 'filologo',
        name: 'El Filólogo',
        rarity: 'legendaria',
        cost: 3,
        description: 'Durante todo el combate, tus aciertos hacen +50 % de daño.',
        effect: { kind: 'combat-damage-mult', mult: 1.5 },
      },
      {
        id: 'elixir',
        name: 'Elixir de Claridad',
        rarity: 'rara',
        cost: 1,
        description: 'Recupera 20 de concentración.',
        effect: { kind: 'heal', amount: 20 },
      },
    ] satisfies CardDef[]
  ).map((c) => [c.id, c]),
);

/** Mazo inicial: 10 cartas comunes. */
export const STARTER_DECK: string[] = [
  'pluma-afilada',
  'pluma-afilada',
  'martillo',
  'martillo',
  'reloj-de-arena',
  'reloj-de-arena',
  'lupa',
  'lupa',
  'balsamo',
  'moneda-falsa',
];

const RARITY_WEIGHTS: [Rarity, number][] = [
  ['comun', 55],
  ['rara', 30],
  ['epica', 12],
  ['legendaria', 3],
];

export const CARD_PRICES: Record<Rarity, number> = {
  comun: 35,
  rara: 60,
  epica: 95,
  legendaria: 150,
};

export function rollRarity(rng: Rng, eliteBonus = false): Rarity {
  const weights = eliteBonus
    ? RARITY_WEIGHTS.map(([r, w]) => [r, r === 'comun' ? w / 2 : w * 1.4] as [Rarity, number])
    : RARITY_WEIGHTS;
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [rarity, w] of weights) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return 'comun';
}

export function randomCardOfRarity(rng: Rng, rarity: Rarity): string {
  const pool = Object.values(CARD_DEFS).filter((c) => c.rarity === rarity);
  return pool[Math.floor(rng() * pool.length)].id;
}

/** Tres cartas distintas como recompensa u oferta. */
export function rollCardChoices(rng: Rng, count = 3, eliteBonus = false): string[] {
  const picked = new Set<string>();
  let guard = 0;
  while (picked.size < count && guard++ < 50) {
    picked.add(randomCardOfRarity(rng, rollRarity(rng, eliteBonus)));
  }
  return [...picked];
}
