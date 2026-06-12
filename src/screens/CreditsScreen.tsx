import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CreditsScreen() {
  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="screen-header">
        <Link className="back-btn" to="/">
          ‹
        </Link>
        <h2>Créditos</h2>
      </div>
      <div className="panel" style={{ padding: 18, fontSize: 14.5, lineHeight: 1.7 }}>
        <p>
          <strong>Juegos de Español</strong> — minijuegos personales para el español de nivel C,
          sin servidores y sin prisa.
        </p>
        <p className="text-dim">
          Contenido lingüístico curado a mano para este proyecto. Repetición espaciada con el
          algoritmo FSRS (<span style={{ fontFamily: 'monospace' }}>ts-fsrs</span>).
        </p>
        <p className="text-dim">
          Tipografías: Nunito y Baloo 2 (licencia OFL). Construido con React, Vite, Framer Motion y
          Dexie. Gracias a los autores de todo el software libre utilizado.
        </p>
      </div>
    </motion.div>
  );
}
