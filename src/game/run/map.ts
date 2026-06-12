import { mulberry32, pick, shuffle, type Rng } from '../rng';
import { ELITE_ENEMIES, FLOOR_BOSSES, NORMAL_ENEMIES } from './enemies';
import { EVENT_IDS } from './events';
import type { MapNode, NodeType, RunMap } from './types';

/**
 * Genera el mapa de la primera veta: 8 capas, de 1 a 2 nodos por capa,
 * con elección de camino y un jefe al final. Determinista por semilla.
 */
export function generateMap(seed: number): RunMap {
  const rng: Rng = mulberry32(seed);
  // plantilla de tipos por capa; las capas con dos entradas dan a elegir
  const layerPlans: NodeType[][] = [
    ['combate'],
    shuffle(rng, ['combate', 'evento']),
    shuffle(rng, ['combate', 'mercader']),
    [pick(rng, ['elite', 'combate'] as NodeType[])],
    shuffle(rng, ['fragua', 'evento']),
    ['combate'],
    ['mercader'],
    ['jefe'],
  ];

  const usedEnemies = new Set<string>();
  const pickEnemy = (pool: string[]): string => {
    const fresh = pool.filter((id) => !usedEnemies.has(id));
    const chosen = pick(rng, fresh.length > 0 ? fresh : pool);
    usedEnemies.add(chosen);
    return chosen;
  };

  const nodes: MapNode[] = [];
  const layers: MapNode[][] = layerPlans.map((types, layer) =>
    types.map((type, i) => {
      const node: MapNode = { id: `n-${layer}-${i}`, type, layer, next: [] };
      if (type === 'combate') node.enemyId = pickEnemy(NORMAL_ENEMIES);
      if (type === 'elite') node.enemyId = pickEnemy(ELITE_ENEMIES);
      if (type === 'jefe') node.enemyId = FLOOR_BOSSES[0];
      if (type === 'evento') node.eventId = pick(rng, EVENT_IDS);
      nodes.push(node);
      return node;
    }),
  );

  // cada nodo conecta con todos los de la capa siguiente (elección plena)
  for (let l = 0; l < layers.length - 1; l++) {
    for (const node of layers[l]) {
      node.next = layers[l + 1].map((n) => n.id);
    }
  }

  return { nodes, startIds: layers[0].map((n) => n.id) };
}

export function nodeById(map: RunMap, id: string): MapNode {
  const node = map.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`nodo desconocido: ${id}`);
  return node;
}
