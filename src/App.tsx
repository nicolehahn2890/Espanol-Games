import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMetaStore } from '@/stores/useMetaStore';
import { useRunStore } from '@/stores/useRunStore';
import { requestPersistentStorage } from '@/db/db';
import { loadContent } from '@/content/loader';
import { unlockAudio, sfx } from '@/fx/audio';
import { AchievementToast } from '@/components/ui/AchievementToast';

export function App() {
  const metaReady = useMetaStore((s) => s.ready);
  const runReady = useRunStore((s) => s.ready);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    void useMetaStore.getState().init();
    void useRunStore.getState().init();
    void requestPersistentStorage();
    void loadContent().catch(() => {
      /* la pantalla que lo necesite reintentará */
    });
  }, []);

  const ready = metaReady && runReady;

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
        <motion.h1
          className="home-title"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          La Forja
          <br />
          del Idioma
        </motion.h1>
        <span className="splash-hint">{ready ? 'Toca para forjar' : 'Encendiendo la fragua…'}</span>
      </div>
    );
  }

  return (
    <>
      <div id="fx-root">
        <Outlet />
      </div>
      <canvas id="particle-canvas" />
      <div id="screen-flash" />
      <div id="damage-vignette" />
      <AchievementToast />
    </>
  );
}
