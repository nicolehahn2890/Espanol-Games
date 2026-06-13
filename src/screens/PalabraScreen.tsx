import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { WordleWord } from '@/content/schema';
import { loadContent, type ContentIndex } from '@/content/loader';
import {
  dailyWord,
  evaluateGuess,
  keyboardStates,
  MAX_GUESSES,
  normalizeWord,
  randomWord,
  WORD_LENGTH,
  type CellState,
} from '@/game/wordle';
import { todayKey } from '@/game/daily';
import { loadDifficulty, saveDifficulty, difficultyLevels, type DifficultyChoice } from '@/game/difficulty';
import { useMetaStore } from '@/stores/useMetaStore';
import { DifficultyPicker } from '@/components/ui/DifficultyPicker';
import { ExplanationCard } from '@/components/ui/ExplanationCard';
import { IconPalabra } from '@/components/ui/Icon';
import { sfx } from '@/fx/audio';
import { celebrateSmall, celebrateVictory } from '@/fx/celebrate';
import { floatPoints, screenShake } from '@/fx/shake';

const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];

type Mode = 'diaria' | 'practica';

export function PalabraScreen() {
  const meta = useMetaStore();
  const [content, setContent] = useState<ContentIndex | null>(null);
  const [mode, setMode] = useState<Mode>('diaria');
  const [target, setTarget] = useState<WordleWord | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [finished, setFinished] = useState<'win' | 'lose' | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(loadDifficulty());
  const dailyDone = meta.meta.lastDailyDate === todayKey();

  useEffect(() => {
    void loadContent().then((c) => {
      setContent(c);
      if (c.wordleWords.length > 0 && !dailyDone) {
        setTarget(dailyWord(c.wordleWords));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPractice(diff: DifficultyChoice) {
    if (!content) return;
    saveDifficulty(diff);
    setDifficulty(diff);
    setMode('practica');
    setTarget(randomWord(content.wordleWords, difficultyLevels(diff)));
    setGuesses([]);
    setCurrent('');
    setFinished(null);
  }

  function submitGuess() {
    if (!target || finished) return;
    if (current.length !== WORD_LENGTH) {
      screenShake(5, 0.18);
      sfx('wrong');
      return;
    }
    const next = [...guesses, current];
    setGuesses(next);
    setCurrent('');
    const won = normalizeWord(current) === target.word;
    if (won) {
      setFinished('win');
      sfx('levelUp');
      celebrateVictory();
      finish(true, next.length);
    } else if (next.length >= MAX_GUESSES) {
      setFinished('lose');
      sfx('wrong');
      finish(false, next.length);
    } else {
      sfx('cardPlay');
    }
  }

  function finish(won: boolean, attempts: number) {
    if (mode === 'diaria') {
      meta.markDailyDone();
      meta.unlock('palabra-1');
      if (won && attempts <= 2) meta.unlock('palabra-genio');
    }
    const xp = won ? 30 + (MAX_GUESSES - attempts) * 8 : 8;
    meta.addXp(xp);
    if (won) {
      meta.unlock('primer-golpe');
      setTimeout(() => floatPoints(document.querySelector('.wordle-grid'), `+${xp} XP`), 650);
    }
  }

  function pressKey(key: string) {
    if (finished || !target) return;
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACK') {
      setCurrent((c) => c.slice(0, -1));
      sfx('tap');
    } else if (current.length < WORD_LENGTH) {
      setCurrent((c) => c + key);
      sfx('tap');
    }
  }

  const kbStates = useMemo(
    () => (target ? keyboardStates(guesses, target.word) : new Map<string, CellState>()),
    [guesses, target],
  );

  // teclado físico (escritorio)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') {
        pressKey('ENTER');
      } else if (e.key === 'Backspace') {
        pressKey('BACK');
      } else if (/^[a-zñA-ZÑ]$/.test(e.key)) {
        pressKey(e.key.toUpperCase());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const header = (
    <div className="screen-header">
      <Link className="back-btn" to="/">
        ‹
      </Link>
      <span className="title-badge green">
        <IconPalabra size={22} />
      </span>
      <h2>La Palabra</h2>
      {mode === 'diaria' && target && <span className="text-dim" style={{ fontSize: 13, fontWeight: 700 }}>del día</span>}
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

  // diaria ya jugada y sin partida en curso → ofrecer práctica
  if (!target) {
    return (
      <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {header}
        <div className="panel" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <h3 style={{ fontSize: 21, margin: '8px 0' }}>La palabra de hoy ya está resuelta</h3>
          <p className="text-dim" style={{ fontSize: 14.5 }}>
            Mañana habrá una nueva. Mientras tanto puedes practicar sin límite:
          </p>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          <button className="btn btn-green btn-block" onClick={() => startPractice(difficulty)}>
            Practicar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="screen">
      {header}

      <div className="wordle-grid">
        {Array.from({ length: MAX_GUESSES }, (_, row) => {
          const guess = guesses[row];
          const isCurrent = row === guesses.length && !finished;
          const letters = guess
            ? normalizeWord(guess).split('')
            : isCurrent
              ? current.padEnd(WORD_LENGTH).split('')
              : Array(WORD_LENGTH).fill(' ');
          const states = guess ? evaluateGuess(guess, target.word) : null;
          const isWinner =
            finished === 'win' && guess !== undefined && normalizeWord(guess) === target.word;
          return (
            <div className={`wordle-row ${isWinner ? 'winner' : ''}`} key={row}>
              {letters.map((letter, col) => (
                <div
                  key={col}
                  className={`wordle-cell ${states ? `${states[col]} reveal` : ''} ${
                    isCurrent && letter.trim() ? 'filled' : ''
                  }`}
                  style={states ? { animationDelay: `${col * 90}ms` } : undefined}
                >
                  {letter.trim()}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {finished && (
        <>
          <ExplanationCard
            correct={finished === 'win'}
            answer={target.display}
            glossDe={target.glossDe}
          >
            {target.definitionEs}
          </ExplanationCard>
          <div style={{ height: 12 }} />
          <button
            className="btn btn-green btn-block"
            onClick={() => {
              celebrateSmall();
              startPractice(difficulty);
            }}
          >
            Otra palabra
          </button>
          <Link to="/" className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>
            Volver al inicio
          </Link>
        </>
      )}

      {!finished && (
        <div className="kb">
          {KB_ROWS.map((row, i) => (
            <div className="kb-row" key={row}>
              {i === 2 && (
                <button className="kb-key wide" onClick={() => pressKey('ENTER')}>
                  Enviar
                </button>
              )}
              {row.split('').map((key) => (
                <button
                  key={key}
                  className={`kb-key ${kbStates.get(key) ?? ''}`}
                  onClick={() => pressKey(key)}
                >
                  {key}
                </button>
              ))}
              {i === 2 && (
                <button className="kb-key wide" onClick={() => pressKey('BACK')}>
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
