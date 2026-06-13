import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMetaStore } from '@/stores/useMetaStore';
import { requestPersistentStorage } from '@/db/db';
import { loadContent } from '@/content/loader';
import { unlockAudio, sfx } from '@/fx/audio';
import { AchievementToast } from '@/components/ui/AchievementToast';
import { LogoCandy } from '@/components/ui/Icon';

export function App() {
  const metaReady = useMetaStore((s) => s.ready);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    void useMetaStore.getState().init();
    void requestPersistentStorage();
    void loadContent().catch(() => {
      /* la pantalla que lo necesite reintentará */
    });
  }, []);

  if (!entered) {
    return (
      <div
        className="splash"
        // onClick (no pointerdown): evita que el mismo toque atraviese el
        // splash y pulse la baldosa que queda debajo
        onClick={() => {
          unlockAudio();
          sfx('cardPlay');
          setEntered(true);
        }}
      >
        <motion.div
          className="splash-logo"
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: -8 }}
          transition={{ type: 'spring', stiffness: 240, damping: 14 }}
        >
          <LogoCandy size={128} />
        </motion.div>
        <motion.h1
          className="home-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="brand">Juegos de Español</span>
        </motion.h1>
        <span className="splash-hint">{metaReady ? '¡Toca para jugar!' : 'Cargando…'}</span>
      </div>
    );
  }

  return (
    <>
      <div id="fx-root">
        <Outlet />
      </div>
      <canvas id="particle-canvas" />
      <AchievementToast />
    </>
  );
}
