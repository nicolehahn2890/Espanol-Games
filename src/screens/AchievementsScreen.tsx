import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS } from '@/game/achievements';
import { useMetaStore } from '@/stores/useMetaStore';
import { IconCandado, IconTrofeo } from '@/components/ui/Icon';
import { Bar } from '@/components/ui/Bar';

export function AchievementsScreen() {
  const meta = useMetaStore((s) => s.meta);
  const unlocked = new Set(meta.achievements);
  const total = ACHIEVEMENTS.length;
  const got = unlocked.size;

  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="screen-header">
        <Link className="back-btn" to="/">
          ‹
        </Link>
        <h2>Logros</h2>
      </div>

      <div className="panel hero-card">
        <div className="hero-icon" style={{ background: 'linear-gradient(180deg,#ffd34d,#ff9600)' }}>
          <IconTrofeo size={34} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>
            {got} de {total} logros
          </div>
          <div style={{ marginTop: 6 }}>
            <Bar value={got} max={total} color="gold" />
          </div>
        </div>
      </div>

      <div className="achievement-grid">
        {ACHIEVEMENTS.map((a, i) => {
          const done = unlocked.has(a.id);
          return (
            <motion.div
              key={a.id}
              className={`achievement-card ${done ? 'done' : 'locked'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.02 * i }}
            >
              <span className="ach-badge">
                {done ? <IconTrofeo size={26} /> : <IconCandado size={24} />}
              </span>
              <span className="ach-name">{a.name}</span>
              <span className="ach-desc">{a.description}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
