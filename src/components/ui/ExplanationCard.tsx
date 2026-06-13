import { motion } from 'framer-motion';

interface ExplanationCardProps {
  correct: boolean;
  /** respuesta correcta, destacada */
  answer?: string;
  /** glosa alemana opcional, mostrada discretamente */
  glossDe?: string;
  children: React.ReactNode;
}

/** Tarjeta grande de explicación tras responder: la parte didáctica del juego. */
export function ExplanationCard({ correct, answer, glossDe, children }: ExplanationCardProps) {
  return (
    <motion.div
      className={`explanation-card ${correct ? '' : 'wrong'}`}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <div className="exp-title">{correct ? <>✅ ¡Muy bien!</> : <>💡 Para recordar</>}</div>
      {answer && (
        <div className="exp-answer">
          {answer}
          {glossDe && (
            <span className="text-dim" style={{ fontWeight: 600 }}>
              {' '}
              · 🇩🇪 {glossDe}
            </span>
          )}
        </div>
      )}
      <div className="exp-text">{children}</div>
    </motion.div>
  );
}
