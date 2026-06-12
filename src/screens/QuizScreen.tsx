import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Challenge } from '@/content/schema';
import { srsItemId } from '@/content/schema';
import { loadContent, type ContentIndex } from '@/content/loader';
import { rate, Rating } from '@/srs/fsrs';
import {
  buildQuizRound,
  QUIZ_CATEGORIES,
  quizStars,
  quizXp,
  type QuizCategory,
} from '@/game/quiz';
import { loadDifficulty, saveDifficulty, type DifficultyChoice } from '@/game/difficulty';
import { hashString, mulberry32, shuffle } from '@/game/rng';
import { db } from '@/db/db';
import { useMetaStore } from '@/stores/useMetaStore';
import { DifficultyPicker } from '@/components/ui/DifficultyPicker';
import { ExplanationCard } from '@/components/ui/ExplanationCard';
import { sfx } from '@/fx/audio';
import { burstFromElement } from '@/fx/particles';
import { screenShake } from '@/fx/shake';
import { celebrateSmall, celebrateVictory } from '@/fx/celebrate';

type Phase = 'inicio' | 'jugando' | 'fin';

interface AnswerLog {
  challengeId: string;
  correct: boolean;
}

export function QuizScreen() {
  const meta = useMetaStore();
  const [content, setContent] = useState<ContentIndex | null>(null);
  const [phase, setPhase] = useState<Phase>('inicio');
  const [category, setCategory] = useState<QuizCategory>('mixta');
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(loadDifficulty());
  const [round, setRound] = useState<Challenge[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    void loadContent().then(setContent);
  }, []);

  const challenge = round[index];

  const options = useMemo(() => {
    if (!challenge) return [];
    const rng = mulberry32(hashString(challenge.id));
    return shuffle(rng, [challenge.answer, ...(challenge.distractors ?? [])]);
  }, [challenge]);

  const [before, after] = useMemo(() => {
    if (!challenge) return ['', ''];
    const match = challenge.sentence.match(/^(.*)\{[^}]*\}(.*)$/s);
    return match ? [match[1], match[2]] : [challenge.sentence, ''];
  }, [challenge]);

  async function start() {
    if (!content) return;
    saveDifficulty(difficulty);
    const r = await buildQuizRound(content, category, difficulty);
    setRound(r);
    setIndex(0);
    setAnswers([]);
    setPicked(null);
    setPhase('jugando');
    sfx('cardPlay');
  }

  function pick(option: string, target: EventTarget | null) {
    if (picked || !challenge) return;
    const correct = option === challenge.answer;
    setPicked(option);
    setAnswers((a) => [...a, { challengeId: challenge.id, correct }]);
    void rate(srsItemId(challenge), correct ? Rating.Good : Rating.Again, 'blitz');
    if (correct) {
      sfx('correct');
      burstFromElement(target instanceof Element ? target : null, 'teal');
      meta.unlock('primer-golpe');
    } else {
      sfx('wrong');
      screenShake(6, 0.2);
    }
  }

  function next() {
    if (index + 1 < round.length) {
      setIndex((i) => i + 1);
      setPicked(null);
    } else {
      finishRound();
    }
  }

  function finishRound() {
    setPhase('fin');
    const correct = answers.filter((a) => a.correct).length;
    const stars = quizStars(correct, round.length);
    meta.addXp(quizXp(correct, stars));
    meta.update({ quizRounds: (meta.meta.quizRounds ?? 0) + 1 });
    if ((meta.meta.quizRounds ?? 0) + 1 >= 10) meta.unlock('quiz-10');
    if (correct === round.length && round.length >= 10) meta.unlock('quiz-perfecto');
    void db.scores.add({
      mode: 'quiz',
      score: correct,
      maxCombo: 0,
      answered: round.length,
      correct,
      date: new Date().toISOString(),
    });
    if (stars >= 2) celebrateVictory();
    else if (stars >= 1) celebrateSmall();
  }

  const header = (
    <div className="screen-header">
      <Link className="back-btn" to="/">
        ‹
      </Link>
      <h2>❓ Quiz</h2>
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
        <div className="panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Tema</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUIZ_CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`difficulty-btn ${category === c.id ? 'selected' : ''}`}
                style={{ flex: '1 1 30%', padding: '10px 6px' }}
                onClick={() => {
                  sfx('tap');
                  setCategory(c.id);
                }}
              >
                <span className="diff-emoji" style={{ fontSize: 22 }}>
                  {c.emoji}
                </span>
                {c.label}
              </button>
            ))}
          </div>
          <h3 style={{ fontSize: 18, margin: '16px 0 4px' }}>Dificultad</h3>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          <button className="btn btn-blue btn-block" onClick={() => void start()}>
            Empezar · 10 preguntas
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'fin') {
    const correct = answers.filter((a) => a.correct).length;
    const stars = quizStars(correct, round.length);
    return (
      <motion.div className="screen" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        {header}
        <h3 className="victory-title" style={stars === 0 ? { color: 'var(--text-dim)' } : undefined}>
          {stars === 3 ? '¡Perfecto!' : stars >= 1 ? '¡Bien hecho!' : 'A seguir practicando'}
        </h3>
        <div className="stars-row">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.25 + i * 0.2, type: 'spring', stiffness: 300, damping: 14 }}
            >
              {i < stars ? '⭐' : '☆'}
            </motion.span>
          ))}
        </div>
        <div className="result-grid">
          <div className="panel result-cell">
            <div className="result-value">
              {correct}/{round.length}
            </div>
            <div className="result-label">Aciertos</div>
          </div>
          <div className="panel result-cell">
            <div className="result-value">+{quizXp(correct, stars)}</div>
            <div className="result-label">XP</div>
          </div>
        </div>
        <button className="btn btn-blue btn-block" onClick={() => setPhase('inicio')}>
          Otra ronda
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
      <div className="quiz-progress">
        {round.map((_, i) => (
          <span
            key={i}
            className={`dot ${
              i < answers.length ? (answers[i].correct ? 'ok' : 'fail') : i === index ? 'current' : ''
            }`}
          />
        ))}
      </div>

      {challenge && (
        <motion.div
          className="panel challenge-card"
          key={challenge.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          <p className="challenge-sentence">
            {before}
            <span className="challenge-gap">{picked ? challenge.answer : '¿?'}</span>
            {after}
          </p>
          <div className="challenge-options">
            {options.map((opt) => {
              const cls = picked
                ? opt === challenge.answer
                  ? 'correct'
                  : opt === picked
                    ? 'wrong'
                    : ''
                : '';
              return (
                <button
                  key={opt}
                  className={`option-btn ${cls}`}
                  disabled={Boolean(picked)}
                  onClick={(e) => pick(opt, e.target)}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {picked && (
            <>
              <ExplanationCard correct={picked === challenge.answer} answer={challenge.answer}>
                {challenge.explanation}
              </ExplanationCard>
              <div style={{ height: 12 }} />
              <button className="btn btn-blue btn-block" onClick={next}>
                {index + 1 < round.length ? 'Continuar' : 'Ver resultado'}
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
