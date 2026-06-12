import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMetaStore } from '@/stores/useMetaStore';
import { levelFromXp, levelProgress, titleForLevel } from '@/game/xp';
import { todayKey } from '@/game/daily';
import { Bar } from '@/components/ui/Bar';
import { sfx } from '@/fx/audio';

export function HomeScreen() {
  const meta = useMetaStore((s) => s.meta);
  const navigate = useNavigate();
  const level = levelFromXp(meta.xp);
  const dailyDone = meta.lastDailyDate === todayKey();

  const tiles = [
    {
      icon: '🟩',
      name: 'La Palabra',
      desc: dailyDone
        ? 'Reto diario completado. ¡Sigue practicando!'
        : 'Adivina la palabra del día en 6 intentos.',
      to: '/palabra',
      cls: 'tile-green',
      badge: dailyDone ? '✓ hoy' : '1 al día',
    },
    {
      icon: '❓',
      name: 'Quiz',
      desc: 'Rondas de 10 preguntas con explicación.',
      to: '/quiz',
      cls: 'tile-blue',
      badge: null,
    },
    {
      icon: '🃏',
      name: 'Parejas',
      desc: 'Une cada palabra con su significado.',
      to: '/parejas',
      cls: 'tile-orange',
      badge: null,
    },
    {
      icon: '🧩',
      name: 'Grupos',
      desc: 'Encuentra los 4 grupos de 4 palabras.',
      to: '/grupos',
      cls: 'tile-purple',
      badge: null,
    },
  ];

  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="home-title">
        <span className="brand">Juegos de Español</span>
      </h1>
      <p className="home-subtitle">Cuatro juegos, cero prisa, mucho español.</p>

      <div className="panel home-stats">
        <div>
          <div style={{ fontWeight: 800 }}>
            Nivel {level} <span className="text-dim">· {titleForLevel(level)}</span>
          </div>
          <div style={{ width: 150, marginTop: 6 }}>
            <Bar value={levelProgress(meta.xp) * 100} max={100} color="gold" />
          </div>
        </div>
        <div className="streak-flame" title="Racha de días">
          🔥 {meta.streak}
        </div>
      </div>

      {tiles.map((tile, i) => (
        <motion.button
          key={tile.name}
          className={`game-tile ${tile.cls}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 24 }}
          onClick={() => {
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
          {tile.badge && <span className="tile-badge">{tile.badge}</span>}
        </motion.button>
      ))}

      <div className="home-footer">
        <Link to="/logros">Logros</Link>
        <Link to="/estadisticas">Estadísticas</Link>
        <Link to="/ajustes">Ajustes</Link>
      </div>
    </motion.div>
  );
}
