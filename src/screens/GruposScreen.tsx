import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { GroupPuzzle } from '@/content/schema';
import { loadContent, type ContentIndex } from '@/content/loader';
import {
  groupsXp,
  isOneAway,
  matchGroup,
  MAX_MISTAKES,
  nextPuzzle,
  shuffledWords,
} from '@/game/groups';
import { loadDifficulty, saveDifficulty, type DifficultyChoice } from '@/game/difficulty';
import { useMetaStore } from '@/stores/useMetaStore';
import { DifficultyPicker } from '@/components/ui/DifficultyPicker';
import { IconGrupos } from '@/components/ui/Icon';
import { sfx } from '@/fx/audio';
import { celebrateVictory } from '@/fx/celebrate';
import { burstFromElement } from '@/fx/particles';
import { floatPoints, screenShake } from '@/fx/shake';

type Phase = 'inicio' | 'jugando' | 'fin';

export function GruposScreen() {
  const meta = useMetaStore();
  const [content, setContent] = useState<ContentIndex | null>(null);
  const [phase, setPhase] = useState<Phase>('inicio');
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(loadDifficulty());
  const [puzzle, setPuzzle] = useState<GroupPuzzle | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    void loadContent().then(setContent);
  }, []);

  function start() {
    if (!content) return;
    saveDifficulty(difficulty);
    const p = nextPuzzle(content.groupPuzzles, meta.meta.solvedGroupPuzzles ?? [], difficulty);
    if (!p) return;
    setPuzzle(p);
    setWords(shuffledWords(p));
    setSelection([]);
    setSolvedGroups([]);
    setMistakes(0);
    setHint(null);
    setWon(false);
    setPhase('jugando');
    sfx('cardPlay');
  }

  function toggleWord(word: string) {
    if (!puzzle) return;
    setHint(null);
    sfx('tap');
    setSelection((sel) =>
      sel.includes(word) ? sel.filter((w) => w !== word) : sel.length < 4 ? [...sel, word] : sel,
    );
  }

  function check() {
    if (!puzzle || selection.length !== 4) return;
    const groupIndex = matchGroup(puzzle, selection);
    if (groupIndex !== null) {
      const solved = [...solvedGroups, groupIndex];
      setSolvedGroups(solved);
      setWords((ws) => ws.filter((w) => !selection.includes(w)));
      setSelection([]);
      sfx('correct');
      const grid = document.querySelector('.groups-grid');
      burstFromElement(grid, 'gold', 16);
      floatPoints(grid, '+8 XP', '#a560f8');
      if (solved.length === 4) {
        finish(true, solved.length, mistakes);
      }
    } else {
      const oneAway = isOneAway(puzzle, selection);
      setHint(oneAway ? '¡Casi! Te falta una.' : null);
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= MAX_MISTAKES) finish(false, solvedGroups.length, nextMistakes);
      sfx('wrong');
      screenShake(6, 0.2);
      setSelection([]);
    }
  }

  function finish(didWin: boolean, solvedCount: number, mistakeCount: number) {
    setWon(didWin);
    if (puzzle) {
      meta.update({
        solvedGroupPuzzles: [...(meta.meta.solvedGroupPuzzles ?? []), puzzle.id],
      });
      const total = (meta.meta.solvedGroupPuzzles ?? []).length + 1;
      if (didWin) {
        meta.unlock('grupos-1');
        if (mistakeCount === 0) meta.unlock('grupos-limpio');
        if (total >= 10) meta.unlock('grupos-10');
        celebrateVictory();
      }
    }
    meta.addXp(groupsXp(solvedCount, mistakeCount, didWin));
    setTimeout(() => setPhase('fin'), didWin ? 800 : 400);
  }

  const header = (
    <div className="screen-header">
      <Link className="back-btn" to="/">
        ‹
      </Link>
      <span className="title-badge purple">
        <IconGrupos size={22} />
      </span>
      <h2>Grupos</h2>
      {puzzle && phase === 'jugando' && (
        <span className="text-dim" style={{ fontSize: 13, fontWeight: 700 }}>
          nº {puzzle.id.slice(3).replace(/^0+/, '')}
        </span>
      )}
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
    const solvedTotal = (meta.meta.solvedGroupPuzzles ?? []).length;
    return (
      <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {header}
        <div className="panel" style={{ padding: 20, textAlign: 'center' }}>
          <div className="intro-icon" style={{ background: 'linear-gradient(135deg,#bd84ff,var(--purple))' }}>
            <IconGrupos size={38} />
          </div>
          <h3 style={{ fontSize: 20, margin: '8px 0' }}>Encuentra los 4 grupos</h3>
          <p className="text-dim" style={{ fontSize: 14.5 }}>
            16 palabras esconden 4 categorías de 4. Selecciona 4 palabras que tengan algo en común
            y comprueba. Tienes {MAX_MISTAKES} intentos fallidos. {solvedTotal > 0 && (
              <>
                Llevas <strong>{solvedTotal}</strong> resueltos.
              </>
            )}
          </p>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          <button className="btn btn-purple btn-block" onClick={start}>
            Jugar
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'fin' && puzzle) {
    return (
      <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {header}
        <h3 className="victory-title" style={!won ? { color: 'var(--text-dim)' } : undefined}>
          {won ? '¡Resuelto!' : 'Se acabaron los intentos'}
        </h3>
        {puzzle.groups.map((g, i) => (
          <div key={i} className={`solved-group sg-${i}`}>
            <div className="sg-label">{g.label}</div>
            <div className="sg-words">{g.words.join(' · ')}</div>
            <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.95 }}>{g.explanation}</div>
          </div>
        ))}
        <div style={{ height: 8 }} />
        <button className="btn btn-purple btn-block" onClick={start}>
          Otro rompecabezas
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
      {puzzle &&
        solvedGroups.map((gi) => (
          <div key={gi} className={`solved-group sg-${gi}`}>
            <div className="sg-label">{puzzle.groups[gi].label}</div>
            <div className="sg-words">{puzzle.groups[gi].words.join(' · ')}</div>
          </div>
        ))}

      <div className="groups-grid">
        {words.map((word) => (
          <button
            key={word}
            className={`group-word ${selection.includes(word) ? 'selected' : ''}`}
            onClick={() => toggleWord(word)}
          >
            {word}
          </button>
        ))}
      </div>

      <div className="mistakes-row">
        Intentos restantes:
        {Array.from({ length: MAX_MISTAKES }, (_, i) => (
          <span key={i} className={`mistake-dot ${i < mistakes ? 'used' : ''}`} />
        ))}
      </div>
      {hint && (
        <p style={{ textAlign: 'center', color: 'var(--orange)', fontWeight: 800, margin: '0 0 8px' }}>
          {hint}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-block"
          onClick={() => {
            sfx('tap');
            setSelection([]);
          }}
          disabled={selection.length === 0}
        >
          Limpiar
        </button>
        <button className="btn btn-purple btn-block" onClick={check} disabled={selection.length !== 4}>
          Comprobar
        </button>
      </div>
    </div>
  );
}
