import { motion } from 'framer-motion';
import { CARD_DEFS } from '@/game/run/cards';
import type { Rarity } from '@/game/run/types';

const RARITY_LABEL: Record<Rarity, string> = {
  comun: 'común',
  rara: 'rara',
  epica: 'épica',
  legendaria: 'legendaria',
};

const RARITY_VAR: Record<Rarity, string> = {
  comun: 'var(--rarity-comun)',
  rara: 'var(--rarity-rara)',
  epica: 'var(--rarity-epica)',
  legendaria: 'var(--rarity-legendaria)',
};

interface CardViewProps {
  defId: string;
  disabled?: boolean;
  showCost?: boolean;
  onClick?: () => void;
}

export function CardView({ defId, disabled, showCost = true, onClick }: CardViewProps) {
  const def = CARD_DEFS[defId];
  if (!def) return null;
  return (
    <motion.button
      className={`game-card ${def.rarity} ${disabled ? 'disabled' : ''}`}
      style={{ ['--rarity' as string]: RARITY_VAR[def.rarity] }}
      whileTap={disabled ? undefined : { scale: 0.92, rotate: -2 }}
      initial={{ opacity: 0, y: 26, rotateY: 80 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={disabled ? undefined : onClick}
    >
      {showCost && <span className="card-cost">{def.cost}</span>}
      <span className="card-name">{def.name}</span>
      <span className="card-desc">{def.description}</span>
      <span className="card-rarity">{RARITY_LABEL[def.rarity]}</span>
    </motion.button>
  );
}
