import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Challenge } from '@/content/schema';
import { hashString, mulberry32, shuffle } from '@/game/rng';
import { sfx } from '@/fx/audio';
import { burstFromElement } from '@/fx/particles';
import { screenFlash } from '@/fx/shake';

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isCorrectAnswer(challenge: Challenge, given: string): boolean {
  const g = normalize(given);
  if (g === normalize(challenge.answer)) return true;
  return (challenge.acceptedAlt ?? []).some((alt) => normalize(alt) === g);
}

export interface ChallengeResolution {
  correct: boolean;
  givenAnswer: string;
}

interface ChallengeViewProps {
  challenge: Challenge;
  /** letras iniciales reveladas (carta Lupa) */
  revealLetters?: number;
  /** se llama al responder (antes de mostrar la explicación) */
  onAnswered: (resolution: ChallengeResolution) => void;
  /** se llama al pulsar «Continuar» tras ver la explicación */
  onContinue: () => void;
  /** oculta la explicación y continúa al instante (Contrarreloj) */
  instant?: boolean;
}

export function ChallengeView({
  challenge,
  revealLetters = 0,
  onAnswered,
  onContinue,
  instant = false,
}: ChallengeViewProps) {
  const [resolved, setResolved] = useState<ChallengeResolution | null>(null);
  const [typed, setTyped] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const isTyped = challenge.type === 'cloze-typed';
  const [before, after] = useMemo(() => {
    const match = challenge.sentence.match(/^(.*)\{[^}]*\}(.*)$/s);
    return match ? [match[1], match[2]] : [challenge.sentence, ''];
  }, [challenge.sentence]);

  const options = useMemo(() => {
    if (isTyped) return [];
    const rng = mulberry32(hashString(challenge.id));
    return shuffle(rng, [challenge.answer, ...(challenge.distractors ?? [])]);
  }, [challenge, isTyped]);

  const hint =
    revealLetters > 0 && isTyped ? challenge.answer.slice(0, revealLetters) : '';

  function resolve(given: string) {
    if (resolved) return;
    const correct = isCorrectAnswer(challenge, given);
    const resolution = { correct, givenAnswer: given };
    setResolved(resolution);
    if (correct) {
      sfx('correct');
      screenFlash('gold');
      burstFromElement(cardRef.current, 'gold');
    } else {
      sfx('wrong');
    }
    onAnswered(resolution);
    if (instant) {
      setTimeout(() => onContinue(), correct ? 350 : 900);
    }
  }

  const gapContent = resolved
    ? challenge.answer
    : isTyped
      ? hint || '…'
      : '¿?';

  return (
    <motion.div
      ref={cardRef}
      className="panel challenge-card"
      key={challenge.id}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <p className="challenge-sentence">
        {before}
        <span className="challenge-gap" style={resolved ? { color: 'var(--teal)' } : undefined}>
          {gapContent}
        </span>
        {after}
      </p>

      {isTyped && !resolved && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) resolve(typed);
          }}
        >
          <input
            className="challenge-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={hint ? `${hint}…` : 'Escribe tu respuesta…'}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            autoFocus
          />
          <div style={{ height: 10 }} />
          <button className="btn btn-primary btn-block" type="submit" disabled={!typed.trim()}>
            Forjar respuesta
          </button>
        </form>
      )}

      {!isTyped && (
        <div className="challenge-options">
          {options.map((opt) => {
            const cls = resolved
              ? isCorrectAnswer(challenge, opt)
                ? 'correct'
                : normalize(opt) === normalize(resolved.givenAnswer)
                  ? 'wrong'
                  : ''
              : '';
            return (
              <button
                key={opt}
                className={`option-btn ${cls}`}
                onClick={() => resolve(opt)}
                disabled={Boolean(resolved)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {resolved && !instant && (
        <>
          <div className="challenge-explanation">
            {!resolved.correct && (
              <div style={{ marginBottom: 6 }}>
                Tu respuesta: <strong style={{ color: 'var(--ember)' }}>{resolved.givenAnswer}</strong>
                {' · '}Correcta: <strong style={{ color: 'var(--teal)' }}>{challenge.answer}</strong>
              </div>
            )}
            {challenge.explanation}
          </div>
          <div style={{ height: 12 }} />
          <button className="btn btn-primary btn-block" onClick={onContinue}>
            Continuar
          </button>
        </>
      )}
    </motion.div>
  );
}
