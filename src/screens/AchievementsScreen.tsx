import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS } from '@/game/achievements';
import { useMetaStore } from '@/stores/useMetaStore';

export function AchievementsScreen() {
  const meta = useMetaStore((s) => s.meta);
  const unlocked = new Set(meta.achievements);
  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="screen-header">
        <Link className="back-btn" to="/">
          ‹
        </Link>
        <h2>Logros</h2>
        <span className="text-dim" style={{ fontSize: 13 }}>
          {unlocked.size}/{ACHIEVEMENTS.length}
        </span>
      </div>
      {ACHIEVEMENTS.map((a) => {
        const got = unlocked.has(a.id);
        return (
          <div key={a.id} className="panel list-row" style={{ opacity: got ? 1 : 0.45 }}>
            <span style={{ fontSize: 24 }}>{got ? '🏆' : '🔒'}</span>
            <span style={{ flex: 1 }}>
              <strong style={got ? { color: 'var(--gold)' } : undefined}>{a.name}</strong>
              <br />
              <span className="text-dim" style={{ fontSize: 13 }}>
                {a.description}
              </span>
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}
