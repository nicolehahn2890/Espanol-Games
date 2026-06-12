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
          <strong>La Forja del Idioma</strong> — un juego personal para forjar español de nivel C,
          construido con cariño y sin servidores.
        </p>
        <p className="text-dim">
          Contenido lingüístico curado a mano para este proyecto. La estructura de temas
          gramaticales se inspira en el <em>Plan Curricular del Instituto Cervantes</em> (como
          referencia).
        </p>
        <p className="text-dim">
          Tipografías: Fraunces, Inter y JetBrains Mono (licencia OFL). Repetición espaciada:
          algoritmo FSRS vía <span className="mono">ts-fsrs</span>. Construido con React, Vite,
          Framer Motion, GSAP, sonido sintetizado con WebAudio y Dexie.
        </p>
        <p className="text-dim" style={{ fontSize: 12.5 }}>
          El planificador FSRS y las bibliotecas usadas son software libre; gracias a sus autores.
        </p>
      </div>
    </motion.div>
  );
}
