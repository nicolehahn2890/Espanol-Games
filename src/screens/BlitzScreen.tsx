import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Challenge } from '@/content/schema';
import { srsItemId } from '@/content/schema';
import { loadContent, type ContentIndex } from '@/content/loader';
import { pickWeighted, rate, Rating } from '@/srs/fsrs';
import { BLITZ_SECONDS, blitzPoints, blitzXp } from '@/game/blitz';
import { isComboTierUp } from '@/game/combo';
import { db } from '@/db/db';
import { useMetaStore } from '@/stores/useMetaStore';
import { ChallengeView } from '@/components/challenges/ChallengeView';
import { ComboMeter } from '@/components/ui/ComboMeter';
import { TimerRing } from '@/components/ui/TimerRing';
import { useTimer } from '@/hooks/useTimer';
import { sfx } from '@/fx/audio';
import { screenShake, damageVignette, floatDamageNumber } from '@/fx/shake';
import { celebrateSmall } from '@/fx/celebrate';

type Phase = 'cargando' | 'listo' | 'jugando' | 'fin';

export function BlitzScreen() {
  const [phase, setPhase] = useState<Phase>('cargando');
  const [queue, setQueue] = useState<Challenge[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  const answerStart = useRef(Date.now());
  const scoreRef = useRef<HTMLDivElement>(null);
  const meta = useMetaStore();

  const secondsLeft = useTimer(BLITZ_SECONDS, phase === 'jugando');

  useEffect(() => {
    let alive = true;
    void (async () => {
      const content: ContentIndex = await loadContent();
      const allIds = [...content.challenges.keys()];
      const pickedItemIds = await pickWeighted(
        allIds.map((id) => srsItemId(content.challenges.get(id)!)),
        allIds.length,
      );
      // ordena los retos según la urgencia FSRS de su ítem
      const order = new Map(pickedItemIds.map((id, i) => [id, i]));
      const sorted = [...content.challenges.values()].sort(
        (a, b) => (order.get(srsItemId(a)) ?? 999) - (order.get(srsItemId(b)) ?? 999),
      );
      const top = await db.scores.where('mode').equals('blitz').sortBy('score');
      if (!alive) return;
      setHighScore(top.length ? top[top.length - 1].score : 0);
      setQueue(sorted);
      setPhase('listo');
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (phase === 'jugando' && secondsLeft <= 0) {
      void finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  async function finish() {
    setPhase('fin');
    const xp = blitzXp(correct, maxCombo);
    meta.addXp(xp);
    meta.addFragmentos(Math.round(score / 100));
    if (score > 0) {
      await db.scores.add({
        mode: 'blitz',
        score,
        maxCombo,
        answered,
        correct,
        date: new Date().toISOString(),
      });
    }
    if (score > highScore && highScore > 0) {
      setIsRecord(true);
      celebrateSmall();
    }
    if (maxCombo > meta.meta.bestCombo) meta.update({ bestCombo: maxCombo });
    if (score >= 1000) meta.unlock('mil-puntos');
    if (score >= 3000) meta.unlock('tres-mil');
    if (maxCombo >= 10) meta.unlock('racha-de-fuego');
  }

  function handleAnswered(challenge: Challenge, ok: boolean) {
    const seconds = (Date.now() - answerStart.current) / 1000;
    setAnswered((a) => a + 1);
    if (ok) {
      const newStreak = streak + 1;
      const points = blitzPoints(newStreak, seconds);
      setStreak(newStreak);
      setMaxCombo((m) => Math.max(m, newStreak));
      setCorrect((c) => c + 1);
      setScore((s) => s + points);
      floatDamageNumber(scoreRef.current, `+${points}`);
      if (isComboTierUp(newStreak)) sfx('comboUp');
      meta.unlock('primer-golpe');
      void rate(srsItemId(challenge), seconds <= 5 ? Rating.Easy : Rating.Good, 'blitz');
    } else {
      setStreak(0);
      screenShake(7, 0.22);
      damageVignette();
      void rate(srsItemId(challenge), Rating.Again, 'blitz');
    }
  }

  function next() {
    setIndex((i) => i + 1);
    answerStart.current = Date.now();
  }

  const current = queue[index % Math.max(1, queue.length)];

  const header = (
    <div className="screen-header">
      <Link className="back-btn" to="/">
        ‹
      </Link>
      <h2>Contrarreloj</h2>
      {phase === 'jugando' && <TimerRing secondsLeft={secondsLeft} totalSeconds={BLITZ_SECONDS} />}
    </div>
  );

  if (phase === 'cargando') {
    return (
      <div className="screen">
        {header}
        <p className="text-dim">Encendiendo la fragua…</p>
      </div>
    );
  }

  if (phase === 'listo') {
    return (
      <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {header}
        <div className="panel" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>⏳</div>
          <h3 style={{ fontSize: 22, margin: '10px 0' }}>90 segundos de acero</h3>
          <p className="text-dim" style={{ fontSize: 14.5 }}>
            Responde tantos retos como puedas. Cada acierto consecutivo sube tu combo: ×1,5 → ×2 →
            ×3. Un fallo lo rompe.
          </p>
          {highScore > 0 && (
            <p className="text-gold" style={{ fontWeight: 700 }}>
              Tu récord: {highScore}
            </p>
          )}
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              sfx('cardPlay');
              answerStart.current = Date.now();
              setPhase('jugando');
            }}
          >
            ¡A la fragua!
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'fin') {
    return (
      <motion.div className="screen" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        {header}
        {isRecord && <h3 className="victory-title" style={{ fontSize: 30 }}>¡Nuevo récord!</h3>}
        <div className="result-grid">
          <div className="panel result-cell">
            <div className="result-value">{score}</div>
            <div className="result-label">Puntos</div>
          </div>
          <div className="panel result-cell">
            <div className="result-value">×{maxCombo}</div>
            <div className="result-label">Mejor racha</div>
          </div>
          <div className="panel result-cell">
            <div className="result-value">
              {correct}/{answered}
            </div>
            <div className="result-label">Aciertos</div>
          </div>
          <div className="panel result-cell">
            <div className="result-value">+{blitzXp(correct, maxCombo)}</div>
            <div className="result-label">XP</div>
          </div>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            setScore(0);
            setStreak(0);
            setMaxCombo(0);
            setCorrect(0);
            setAnswered(0);
            setIsRecord(false);
            setIndex((i) => i + 1);
            answerStart.current = Date.now();
            setPhase('jugando');
          }}
        >
          Otra ronda
        </button>
        <div style={{ height: 10 }} />
        <Link to="/" className="btn btn-ghost btn-block">
          Volver a la forja
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="screen">
      {header}
      <div className="hud-row">
        <div ref={scoreRef} className="text-gold mono" style={{ fontSize: 22, fontWeight: 700 }}>
          {score}
        </div>
        <ComboMeter streak={streak} />
      </div>
      {current && (
        <ChallengeView
          key={`${current.id}-${index}`}
          challenge={current}
          instant
          onAnswered={(r) => handleAnswered(current, r.correct)}
          onContinue={next}
        />
      )}
    </div>
  );
}
