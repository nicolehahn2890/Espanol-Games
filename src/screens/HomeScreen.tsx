import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMetaStore } from '@/stores/useMetaStore';
import { useRunStore } from '@/stores/useRunStore';
import { levelFromXp, levelProgress, titleForLevel } from '@/game/xp';
import { Bar } from '@/components/ui/Bar';
import { sfx } from '@/fx/audio';

export function HomeScreen() {
  const meta = useMetaStore((s) => s.meta);
  const run = useRunStore((s) => s.run);
  const navigate = useNavigate();
  const level = levelFromXp(meta.xp);

  const tiles = [
    {
      icon: '⚔️',
      name: 'La Expedición',
      desc: run
        ? 'Tienes una expedición en marcha. ¡Continúala!'
        : 'Desciende a la mina de las palabras y derrota al Académico.',
      to: '/expedicion',
      highlight: Boolean(run),
    },
    {
      icon: '⏳',
      name: 'Contrarreloj',
      desc: '90 segundos. Encadena aciertos y dispara tu combo.',
      to: '/contrarreloj',
    },
    {
      icon: '🔮',
      name: 'El Enigma Diario',
      desc: 'Próximamente: una palabra velada cada día.',
      to: null,
    },
  ];

  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="home-title">La Forja del Idioma</h1>
      <p className="home-subtitle">Forja tu dominio del español, palabra a palabra.</p>

      <div className="panel home-stats">
        <div>
          <div style={{ fontWeight: 700 }}>
            Nivel {level} · <span className="text-gold">{titleForLevel(level)}</span>
          </div>
          <div style={{ width: 160, marginTop: 6 }}>
            <Bar value={levelProgress(meta.xp) * 100} max={100} color="gold" />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-gold" style={{ fontWeight: 700 }}>
            ◆ {meta.fragmentos}
          </div>
          <div className="text-dim" style={{ fontSize: 12 }}>
            fragmentos
          </div>
        </div>
      </div>

      {tiles.map((tile) => (
        <button
          key={tile.name}
          className="panel mode-tile"
          style={tile.highlight ? { borderColor: 'var(--gold)', boxShadow: 'var(--glow-gold)' } : undefined}
          disabled={!tile.to}
          onClick={() => {
            if (!tile.to) return;
            sfx('tap');
            navigate(tile.to);
          }}
        >
          <span className="tile-icon">{tile.icon}</span>
          <span>
            <span className="tile-name">{tile.name}</span>
            <br />
            <span className="tile-desc">{tile.desc}</span>
          </span>
        </button>
      ))}

      <div className="home-footer">
        <Link to="/logros">Logros</Link>
        <Link to="/estadisticas">Estadísticas</Link>
        <Link to="/ajustes">Ajustes</Link>
        <Link to="/creditos">Créditos</Link>
      </div>
    </motion.div>
  );
}
