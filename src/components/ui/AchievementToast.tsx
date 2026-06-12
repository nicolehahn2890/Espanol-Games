import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMetaStore } from '@/stores/useMetaStore';
import { ACHIEVEMENT_MAP } from '@/game/achievements';

export function AchievementToast() {
  const lastAchievement = useMetaStore((s) => s.lastAchievement);
  const clear = useMetaStore((s) => s.clearAchievementToast);

  useEffect(() => {
    if (!lastAchievement) return;
    const t = setTimeout(clear, 3200);
    return () => clearTimeout(t);
  }, [lastAchievement, clear]);

  const def = lastAchievement ? ACHIEVEMENT_MAP.get(lastAchievement) : undefined;

  return (
    <AnimatePresence>
      {def && (
        <motion.div
          className="toast"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          onClick={clear}
        >
          <span style={{ fontSize: 26 }}>🏆</span>
          <div>
            <div className="toast-title">¡Logro: {def.name}!</div>
            <div className="toast-desc">{def.description}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
