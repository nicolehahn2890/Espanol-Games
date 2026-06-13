import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loadContent, type ContentIndex } from '@/content/loader';
import { rate, Rating } from '@/srs/fsrs';
import { buildPairsBoard, pairsXp, PAIRS_PER_BOARD, type PairCard } from '@/game/pairs';
import { loadDifficulty, saveDifficulty, type DifficultyChoice } from '@/game/difficulty';
import { useMetaStore } from '@/stores/useMetaStore';
import { DifficultyPicker } from '@/components/ui/DifficultyPicker';
import { IconParejas } from '@/components/ui/Icon';
import { sfx } from '@/fx/audio';
import { burstFromElement } from '@/fx/particles';
import { celebrateVictory } from '@/fx/celebrate';
import { floatPoints, screenShake } from '@/fx/shake';

type Phase = 'inicio' | 'jugando' | 'fin';

export function ParejasScreen() {
  const meta = useMetaStore();
  const [content, setContent] = useState<ContentIndex | null>(null);
  const [phase, setPhase] = useState<Phase>('inicio');
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(loadDifficulty());
  const [cards, setCards] = useState<PairCard[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mismatch, setMismatch] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const missedPairs = useRef<Set<string>>(new Set());

  useEffect(() => {
    void loadContent().then(setContent);
  }, []);

  function start() {
    if (!content) return;
    saveDifficulty(difficulty);
    setCards(buildPairsBoard(content, difficulty));
    setSelected(null);
    setMatched(new Set());
    setMismatch([]);
    setMistakes(0);
    missedPairs.current = new Set();
    setPhase('jugando');
    sfx('cardPlay');
  }

  function tapCard(card: PairCard, el: EventTarget | null) {
    if (matched.has(card.pairId) || mismatch.length > 0) return;
    sfx('tap');
    if (!selected) {
      setSelected(card.uid);
      return;
    }
    if (selected === card.uid) {
      setSelected(null);
      return;
    }
    const first = cards.find((c) => c.uid === selected)!;
    if (first.pairId === card.pairId) {
      const next = new Set(matched);
      next.add(card.pairId);
      setMatched(next);
      setSelected(null);
      sfx('correct');
      const target = el instanceof Element ? el : null;
      burstFromElement(target, 'teal', 12);
      floatPoints(target, '¡Bien!', '#58cc02');
      if (!missedPairs.current.has(card.pairId)) {
        void rate(card.itemId, Rating.Good, 'parejas');
      }
      if (next.size === PAIRS_PER_BOARD) {
        finish(next.size);
      }
    } else {
      setMismatch([selected, card.uid]);
      setMistakes((m) => m + 1);
      missedPairs.current.add(first.pairId).add(card.pairId);
      void rate(first.itemId, Rating.Again, 'parejas');
      sfx('wrong');
      screenShake(5, 0.18);
      setTimeout(() => {
        setMismatch([]);
        setSelected(null);
      }, 600);
    }
  }

  function finish(matchedCount: number) {
    meta.addXp(pairsXp(matchedCount, mistakes));
    meta.unlock('primer-golpe');
    if (mistakes === 0) meta.unlock('parejas-limpio');
    celebrateVictory();
    setTimeout(() => setPhase('fin'), 700);
  }

  const header = (
    <div className="screen-header">
      <Link className="back-btn" to="/">
        ‹
      </Link>
      <span className="title-badge orange">
        <IconParejas size={22} />
      </span>
      <h2>Parejas</h2>
    </div>
  );

  if (!content) {
    return (
      <div className="screen">
        {header}
        <p className="text-dim">Cargando…</p>
      </div>
    );
  }

  if (phase === 'inicio') {
    return (
      <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {header}
        <div className="panel" style={{ padding: 20, textAlign: 'center' }}>
          <div className="intro-icon" style={{ background: 'linear-gradient(135deg,#ffb340,var(--orange))' }}>
            <IconParejas size={40} />
          </div>
          <h3 style={{ fontSize: 20, margin: '8px 0' }}>Une las parejas</h3>
          <p className="text-dim" style={{ fontSize: 14.5 }}>
            {difficulty === 'dificil'
              ? 'Palabra o modismo ↔ su significado en español.'
              : 'Palabra en español ↔ su traducción al alemán.'}{' '}
            Sin tiempo, sin presión.
          </p>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          <button className="btn btn-orange btn-block" onClick={start}>
            Jugar
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'fin') {
    return (
      <motion.div className="screen" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        {header}
        <h3 className="victory-title">¡Completado!</h3>
        <div className="result-grid">
          <div className="panel result-cell">
            <div className="result-value">{mistakes}</div>
            <div className="result-label">Fallos</div>
          </div>
          <div className="panel result-cell">
            <div className="result-value">+{pairsXp(PAIRS_PER_BOARD, mistakes)}</div>
            <div className="result-label">XP</div>
          </div>
        </div>
        <button className="btn btn-orange btn-block" onClick={start}>
          Otro tablero
        </button>
        <Link to="/" className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>
          Volver al inicio
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="screen">
      {header}
      <p className="text-dim" style={{ fontSize: 13.5, textAlign: 'center', marginTop: 0 }}>
        Toca dos tarjetas que signifiquen lo mismo
      </p>
      <div className="pairs-grid">
        {cards.map((card) => {
          const cls = matched.has(card.pairId)
            ? 'matched'
            : mismatch.includes(card.uid)
              ? 'mismatch'
              : selected === card.uid
                ? 'selected'
                : '';
          return (
            <button
              key={card.uid}
              className={`pair-card ${cls}`}
              onClick={(e) => tapCard(card, e.target)}
            >
              {card.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
