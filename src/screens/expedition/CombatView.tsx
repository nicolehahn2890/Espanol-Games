import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Challenge } from '@/content/schema';
import { srsItemId } from '@/content/schema';
import type { ContentIndex } from '@/content/loader';
import { rate, Rating } from '@/srs/fsrs';
import {
  CHALLENGE_SECONDS,
  combatReducer,
  currentChallengeId,
  type CombatResult,
} from '@/game/run/combat';
import { ENEMY_DEFS } from '@/game/run/enemies';
import { CARD_DEFS } from '@/game/run/cards';
import type { RunState } from '@/game/run/types';
import { ChallengeView } from '@/components/challenges/ChallengeView';
import { ComboMeter } from '@/components/ui/ComboMeter';
import { Bar } from '@/components/ui/Bar';
import { TimerRing } from '@/components/ui/TimerRing';
import { CardView } from '@/components/cards/CardView';
import { EnemySigil } from '@/components/enemies/EnemySigil';
import { useTimer } from '@/hooks/useTimer';
import { sfx } from '@/fx/audio';
import { screenShake, damageVignette, floatDamageNumber } from '@/fx/shake';
import { burstFromElement } from '@/fx/particles';

interface CombatViewProps {
  run: RunState;
  content: ContentIndex;
  onCombatEnd: (outcome: 'victoria' | 'derrota', wrongAnswers: number) => void;
  onUpdate: () => void;
}

export function CombatView({ run, content, onCombatEnd, onUpdate }: CombatViewProps) {
  const combat = run.combat!;
  const enemy = ENEMY_DEFS[combat.enemyId];
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [resolving, setResolving] = useState(false);
  const wrongCount = useRef(0);
  const enemyRef = useRef<HTMLDivElement>(null);

  const totalSeconds = CHALLENGE_SECONDS + combat.modifiers.extraTimeSeconds;
  const secondsLeft = useTimer(totalSeconds, !resolving, `${combat.turn}-${totalSeconds}`);

  // fija el reto del turno actual
  useEffect(() => {
    const id = currentChallengeId(combat);
    setActiveChallenge(content.challenges.get(id) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat.turn]);

  function applyResult(result: CombatResult) {
    run.combat = result.state;
    if (result.playerHeal > 0) {
      run.concentracion = Math.min(run.maxConcentracion, run.concentracion + result.playerHeal);
    }
    if (result.playerDamage > 0) {
      run.concentracion = Math.max(0, run.concentracion - result.playerDamage);
    }
    if (result.coinsGained > 0) {
      run.monedas += result.coinsGained;
      run.stats.coinsEarned += result.coinsGained;
    }
    onUpdate();
  }

  function playFx(result: CombatResult) {
    for (const event of result.events) {
      switch (event.type) {
        case 'HIT':
          sfx('hit');
          floatDamageNumber(enemyRef.current, `−${event.damage}`, '#f2b441');
          burstFromElement(enemyRef.current, 'gold', 14);
          screenShake(4, 0.15);
          break;
        case 'PLAYER_HIT':
          sfx('wrong');
          screenShake(9, 0.3);
          damageVignette();
          break;
        case 'COMBO_UP':
          sfx('comboUp');
          break;
        case 'COMBO_SAVED':
          sfx('coin');
          break;
        case 'COINS':
          sfx('coin');
          break;
        case 'ENEMY_HEALED':
          floatDamageNumber(enemyRef.current, `+${event.amount}`, '#3dd6c3');
          break;
        case 'ENEMY_ENRAGED':
          sfx('bossDown');
          screenShake(12, 0.4);
          break;
        default:
          break;
      }
    }
  }

  function handlePlayCard(uid: string) {
    if (resolving) return;
    const card = combat.hand.find((c) => c.uid === uid);
    if (!card || CARD_DEFS[card.defId].cost > combat.energy) return;
    sfx('cardPlay');
    const result = combatReducer(combat, { type: 'PLAY_CARD', uid });
    playFx(result);
    applyResult(result);
    if (result.events.some((e) => e.type === 'CHALLENGE_SWAPPED')) {
      const id = currentChallengeId(result.state);
      setActiveChallenge(content.challenges.get(id) ?? null);
    }
  }

  function handleAnswered(correct: boolean) {
    if (!activeChallenge) return;
    setResolving(true);
    if (!correct) wrongCount.current += 1;
    run.stats[correct ? 'correct' : 'wrong'] += 1;
    void rate(
      srsItemId(activeChallenge),
      correct ? (secondsLeft / totalSeconds > 0.6 ? Rating.Easy : Rating.Good) : Rating.Again,
      'expedicion',
    );
    const result = combatReducer(combat, {
      type: 'ANSWER',
      correct,
      secondsLeft,
      totalSeconds,
    });
    playFx(result);
    applyResult(result);
    run.stats.bestCombo = Math.max(run.stats.bestCombo, result.state.comboStreak);
    if (result.finished === 'victoria') {
      sfx(enemy.tier === 'jefe' ? 'bossDown' : 'enemyDown');
    }
  }

  function handleContinue() {
    setResolving(false);
    const current = run.combat!;
    if (current.enemyHp <= 0) {
      onCombatEnd('victoria', wrongCount.current);
      return;
    }
    if (run.concentracion <= 0) {
      onCombatEnd('derrota', wrongCount.current);
      return;
    }
    const id = currentChallengeId(current);
    setActiveChallenge(content.challenges.get(id) ?? null);
  }

  return (
    <>
      <div
        ref={enemyRef}
        className={`panel enemy-panel ${combat.enraged ? 'enraged' : ''}`}
      >
        <EnemySigil enemy={enemy} />
        <div className="enemy-info">
          <div className="enemy-name">{enemy.name}</div>
          <div className="enemy-epithet">{enemy.epithet}</div>
          {enemy.quirkText && <div className="enemy-quirk">⚠ {enemy.quirkText}</div>}
          <div style={{ marginTop: 8 }}>
            <Bar value={combat.enemyHp} max={combat.enemyMaxHp} color="ember" />
            <div className="text-dim" style={{ fontSize: 12, marginTop: 2 }}>
              {combat.enemyHp}/{combat.enemyMaxHp} PV {combat.enraged && '· ¡ENFURECIDO!'}
            </div>
          </div>
        </div>
      </div>

      <div className="hud-row">
        <span style={{ flex: 1 }}>
          <span className="text-dim" style={{ fontSize: 12 }}>
            Concentración
          </span>
          <Bar value={run.concentracion} max={run.maxConcentracion} color="teal" />
        </span>
        <ComboMeter streak={combat.comboStreak} />
        {!resolving && <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />}
      </div>

      {activeChallenge && (
        <ChallengeView
          key={`${activeChallenge.id}-${combat.turn}`}
          challenge={activeChallenge}
          revealLetters={combat.modifiers.revealLetters}
          onAnswered={(r) => handleAnswered(r.correct)}
          onContinue={handleContinue}
        />
      )}

      <div className="hud-row" style={{ marginTop: 14 }}>
        <span className="energy-orb">⚡ {combat.energy}</span>
        <span className="text-dim" style={{ fontSize: 12.5 }}>
          Juega cartas antes de responder
        </span>
        <span className="text-gold" style={{ fontWeight: 700 }}>
          🪙 {run.monedas}
        </span>
      </div>

      <div className="hand">
        <AnimatePresence>
          {combat.hand.map((card) => (
            <motion.div key={card.uid} exit={{ opacity: 0, y: -40, scale: 0.7 }}>
              <CardView
                defId={card.defId}
                disabled={resolving || CARD_DEFS[card.defId].cost > combat.energy}
                onClick={() => handlePlayCard(card.uid)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
