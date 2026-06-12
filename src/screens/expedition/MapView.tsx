import { motion } from 'framer-motion';
import type { MapNode, NodeType, RunState } from '@/game/run/types';
import { selectableNodeIds } from '@/game/run/run';
import { sfx } from '@/fx/audio';

const NODE_ICONS: Record<NodeType, string> = {
  combate: '⚔️',
  elite: '💀',
  mercader: '🪙',
  fragua: '🔥',
  evento: '✨',
  jefe: '👑',
};

const NODE_LABELS: Record<NodeType, string> = {
  combate: 'Combate',
  elite: 'Élite',
  mercader: 'Mercader',
  fragua: 'Fragua',
  evento: 'Evento',
  jefe: 'Jefe',
};

interface MapViewProps {
  run: RunState;
  onSelect: (node: MapNode) => void;
}

export function MapView({ run, onSelect }: MapViewProps) {
  const selectable = new Set(selectableNodeIds(run));
  const currentLayer = run.currentNodeId
    ? run.map.nodes.find((n) => n.id === run.currentNodeId)?.layer ?? -1
    : -1;

  const layers = new Map<number, MapNode[]>();
  for (const node of run.map.nodes) {
    const list = layers.get(node.layer) ?? [];
    list.push(node);
    layers.set(node.layer, list);
  }

  return (
    <>
      <div className="hud-row">
        <span className="text-dim">
          Concentración{' '}
          <strong style={{ color: 'var(--teal)' }}>
            {run.concentracion}/{run.maxConcentracion}
          </strong>
        </span>
        <span className="text-gold" style={{ fontWeight: 700 }}>
          🪙 {run.monedas}
        </span>
      </div>
      <p className="text-dim" style={{ fontSize: 13.5, textAlign: 'center' }}>
        Elige tu camino hacia el corazón de la veta.
      </p>
      <div className="map-layers">
        {[...layers.entries()].map(([layer, nodes]) => (
          <div className="map-layer" key={layer}>
            {nodes.map((node) => {
              const isSelectable = selectable.has(node.id);
              const isVisited = layer <= currentLayer;
              return (
                <motion.button
                  key={node.id}
                  className={`map-node ${isSelectable ? 'selectable' : ''} ${isVisited ? 'visited' : ''} ${node.type === 'jefe' ? 'boss' : ''}`}
                  whileTap={isSelectable ? { scale: 0.9 } : undefined}
                  disabled={!isSelectable}
                  onClick={() => {
                    sfx('tap');
                    onSelect(node);
                  }}
                >
                  <span className="node-icon">{NODE_ICONS[node.type]}</span>
                  <span>{NODE_LABELS[node.type]}</span>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
