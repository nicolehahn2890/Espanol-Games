import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loadContent, challengesForDomains, type ContentIndex } from '@/content/loader';
import { srsItemId } from '@/content/schema';
import { getDueQueue } from '@/srs/fsrs';
import { createCombat } from '@/game/run/combat';
import { ENEMY_DEFS } from '@/game/run/enemies';
import { CARD_DEFS } from '@/game/run/cards';
import { RUN_EVENTS } from '@/game/run/events';
import {
  applyEventEffect,
  addCardToDeck,
  coinRewardFor,
  enemyForNode,
  fragmentReward,
  FORGE_REMOVE_PRICE,
  rollRewardCards,
  rollShopOffers,
} from '@/game/run/run';
import type { MapNode, RunState } from '@/game/run/types';
import { hashString } from '@/game/rng';
import { useRunStore } from '@/stores/useRunStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { MapView } from './MapView';
import { CombatView } from './CombatView';
import { CardView } from '@/components/cards/CardView';
import { sfx } from '@/fx/audio';
import { celebrateVictory } from '@/fx/celebrate';

export function ExpeditionScreen() {
  const navigate = useNavigate();
  const runStore = useRunStore();
  const meta = useMetaStore();
  const [content, setContent] = useState<ContentIndex | null>(null);
  const run = runStore.run;

  useEffect(() => {
    void loadContent().then(setContent);
  }, []);

  useEffect(() => {
    if (runStore.ready && !runStore.run) {
      runStore.startRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStore.ready]);

  if (!content || !run) {
    return (
      <div className="screen">
        <div className="screen-header">
          <Link className="back-btn" to="/">
            ‹
          </Link>
          <h2>La Expedición</h2>
        </div>
        <p className="text-dim">Encendiendo las antorchas…</p>
      </div>
    );
  }

  async function enterNode(node: MapNode) {
    if (!run || !content) return;
    run.currentNodeId = node.id;
    if (node.type === 'combate' || node.type === 'elite' || node.type === 'jefe') {
      const enemyId = enemyForNode(run, node.id);
      const enemy = ENEMY_DEFS[enemyId];
      const pool = challengesForDomains(content, enemy.domains);
      const ranking = await getDueQueue(pool.map((c) => srsItemId(c)));
      const order = new Map(ranking.map((r, i) => [r.itemId, i]));
      const queue = [...pool]
        .sort((a, b) => (order.get(srsItemId(a)) ?? 999) - (order.get(srsItemId(b)) ?? 999))
        .slice(0, 14)
        .map((c) => c.id);
      run.combat = createCombat(enemyId, run.deck, queue, run.seed + hashString(node.id));
      run.phase = 'combate';
      meta.discover(`enemy:${enemyId}`);
    } else if (node.type === 'mercader') {
      run.shopOffers = rollShopOffers(run, node.id);
      run.phase = 'mercader';
    } else if (node.type === 'fragua') {
      run.phase = 'fragua';
    } else if (node.type === 'evento') {
      run.eventId = node.eventId ?? null;
      run.phase = 'evento';
    }
    runStore.commit();
  }

  function handleCombatEnd(outcome: 'victoria' | 'derrota', wrongAnswers: number) {
    if (!run) return;
    const node = run.map.nodes.find((n) => n.id === run.currentNodeId);
    const isBoss = node?.type === 'jefe';
    const enemyId = run.combat?.enemyId;
    run.combat = null;
    if (outcome === 'derrota') {
      run.phase = 'derrota';
      finishRun(false);
    } else if (isBoss) {
      run.phase = 'victoria';
      celebrateVictory();
      meta.unlock('primera-victoria');
      if (wrongAnswers === 0) meta.unlock('sin-macula');
      finishRun(true);
    } else {
      if (enemyId === 'falso-amigo') meta.unlock('cazatraidores');
      run.rewardCoins = coinRewardFor(run, run.currentNodeId!);
      run.rewardCardIds = rollRewardCards(run, run.currentNodeId!);
      run.monedas += run.rewardCoins;
      run.stats.coinsEarned += run.rewardCoins;
      run.phase = 'recompensa';
      sfx('coin');
    }
    runStore.commit();
  }

  function finishRun(victory: boolean) {
    if (!run) return;
    const fragmentos = fragmentReward(run, victory);
    meta.addFragmentos(fragmentos);
    meta.addXp(run.stats.correct * 4 + (victory ? 120 : 0));
    meta.update({
      runsPlayed: meta.meta.runsPlayed + 1,
      runsWon: meta.meta.runsWon + (victory ? 1 : 0),
      bestCombo: Math.max(meta.meta.bestCombo, run.stats.bestCombo),
    });
    if (meta.meta.runsPlayed + 1 >= 5) meta.unlock('perseverante');
  }

  function closeRun() {
    runStore.setRun(null);
    navigate('/');
  }

  const header = (
    <div className="screen-header">
      <Link className="back-btn" to="/">
        ‹
      </Link>
      <h2>La Expedición</h2>
      <span className="text-dim" style={{ fontSize: 12 }}>
        Veta I
      </span>
    </div>
  );

  return (
    <div className="screen">
      {header}
      {run.phase === 'mapa' && <MapView run={run} onSelect={(n) => void enterNode(n)} />}

      {run.phase === 'combate' && run.combat && (
        <CombatView
          run={run}
          content={content}
          onCombatEnd={handleCombatEnd}
          onUpdate={() => runStore.commit()}
        />
      )}

      {run.phase === 'recompensa' && (
        <RewardView run={run} onDone={() => ((run.phase = 'mapa'), runStore.commit())} />
      )}

      {run.phase === 'mercader' && (
        <ShopView run={run} onDone={() => ((run.phase = 'mapa'), runStore.commit())} />
      )}

      {run.phase === 'fragua' && (
        <ForgeView run={run} onDone={() => ((run.phase = 'mapa'), runStore.commit())} />
      )}

      {run.phase === 'evento' && run.eventId && (
        <EventView run={run} onDone={() => ((run.phase = 'mapa'), runStore.commit())} />
      )}

      {(run.phase === 'victoria' || run.phase === 'derrota') && (
        <EndView run={run} victory={run.phase === 'victoria'} onClose={closeRun} />
      )}
    </div>
  );
}

/* ---------- Recompensa tras combate ---------- */

function RewardView({ run, onDone }: { run: RunState; onDone: () => void }) {
  const meta = useMetaStore();
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <h3 style={{ fontSize: 22, textAlign: 'center', margin: '14px 0' }}>¡Enemigo forjado!</h3>
      <p className="text-gold" style={{ textAlign: 'center', fontWeight: 700 }}>
        +{run.rewardCoins} monedas
      </p>
      <p className="text-dim" style={{ textAlign: 'center', fontSize: 14 }}>
        Elige una carta para tu mazo:
      </p>
      <div className="shop-row" style={{ justifyContent: 'center' }}>
        {run.rewardCardIds.map((defId) => (
          <CardView
            key={defId}
            defId={defId}
            onClick={() => {
              sfx('cardDraw');
              addCardToDeck(run, defId);
              meta.discover(`card:${defId}`);
              onDone();
            }}
          />
        ))}
      </div>
      <button className="btn btn-ghost btn-block" onClick={onDone}>
        Seguir sin carta
      </button>
    </motion.div>
  );
}

/* ---------- Mercader ---------- */

function ShopView({ run, onDone }: { run: RunState; onDone: () => void }) {
  const meta = useMetaStore();
  const [, force] = useState(0);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <h3 style={{ fontSize: 22, textAlign: 'center', margin: '14px 0' }}>🪙 El Mercader</h3>
      <p className="text-dim" style={{ textAlign: 'center', fontSize: 14 }}>
        «Cartas raras, recién templadas. Tienes {run.monedas} monedas.»
      </p>
      <div className="shop-row" style={{ justifyContent: 'center' }}>
        {run.shopOffers.map((offer, i) => (
          <div key={i} style={{ textAlign: 'center', opacity: offer.sold ? 0.35 : 1 }}>
            <CardView
              defId={offer.defId}
              disabled={offer.sold || run.monedas < offer.price}
              onClick={() => {
                if (offer.sold || run.monedas < offer.price) return;
                sfx('coin');
                run.monedas -= offer.price;
                offer.sold = true;
                addCardToDeck(run, offer.defId);
                meta.discover(`card:${offer.defId}`);
                force((n) => n + 1);
              }}
            />
            <div className="text-gold" style={{ fontWeight: 700, marginTop: 6 }}>
              {offer.sold ? 'Vendida' : `🪙 ${offer.price}`}
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-block" onClick={onDone}>
        Seguir el camino
      </button>
    </motion.div>
  );
}

/* ---------- Fragua ---------- */

function ForgeView({ run, onDone }: { run: RunState; onDone: () => void }) {
  const [tempered, setTempered] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [, force] = useState(0);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <h3 style={{ fontSize: 22, textAlign: 'center', margin: '14px 0' }}>🔥 La Fragua</h3>
      <p className="text-dim" style={{ textAlign: 'center', fontSize: 14 }}>
        El calor del yunque repara la mente y purga el mazo.
      </p>
      <button
        className="btn btn-block"
        disabled={tempered}
        onClick={() => {
          sfx('levelUp');
          run.concentracion = Math.min(run.maxConcentracion, run.concentracion + 15);
          setTempered(true);
        }}
      >
        {tempered ? 'Templada (+15 concentración)' : 'Templar la mente (+15 concentración)'}
      </button>
      <div style={{ height: 10 }} />
      <button
        className="btn btn-block"
        disabled={run.monedas < FORGE_REMOVE_PRICE || run.deck.length <= 5}
        onClick={() => setRemoving((r) => !r)}
      >
        Fundir una carta (🪙 {FORGE_REMOVE_PRICE})
      </button>
      {removing && (
        <div className="shop-row">
          {run.deck.map((card) => (
            <CardView
              key={card.uid}
              defId={card.defId}
              showCost={false}
              onClick={() => {
                sfx('hit');
                run.monedas -= FORGE_REMOVE_PRICE;
                run.deck = run.deck.filter((c) => c.uid !== card.uid);
                setRemoving(false);
                force((n) => n + 1);
              }}
            />
          ))}
        </div>
      )}
      <div style={{ height: 10 }} />
      <button className="btn btn-primary btn-block" onClick={onDone}>
        Seguir el camino
      </button>
    </motion.div>
  );
}

/* ---------- Evento ---------- */

function EventView({ run, onDone }: { run: RunState; onDone: () => void }) {
  const meta = useMetaStore();
  const [resultText, setResultText] = useState<string | null>(null);
  const event = RUN_EVENTS[run.eventId!];
  if (!event) {
    onDone();
    return null;
  }
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <h3 style={{ fontSize: 22, textAlign: 'center', margin: '14px 0' }}>✨ {event.title}</h3>
      <div className="panel" style={{ padding: 18, fontStyle: 'italic', color: 'var(--text-dim)' }}>
        {event.text}
      </div>
      <div style={{ height: 14 }} />
      {resultText === null ? (
        event.options.map((option, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <button
              className="btn btn-block"
              onClick={() => {
                sfx('cardPlay');
                const { gainedCardId } = applyEventEffect(run, event.id, i);
                if (gainedCardId) {
                  meta.discover(`card:${gainedCardId}`);
                  setResultText(`Obtienes: ${CARD_DEFS[gainedCardId].name}`);
                } else {
                  setResultText('Hecho.');
                }
              }}
            >
              {option.label}
            </button>
          </div>
        ))
      ) : (
        <>
          <p className="text-gold" style={{ textAlign: 'center', fontWeight: 700 }}>
            {resultText}
          </p>
          <button className="btn btn-primary btn-block" onClick={onDone}>
            Seguir el camino
          </button>
        </>
      )}
    </motion.div>
  );
}

/* ---------- Fin del run ---------- */

function EndView({ run, victory, onClose }: { run: RunState; victory: boolean; onClose: () => void }) {
  const title = victory ? '¡VICTORIA!' : 'La forja se apaga…';
  const letters = [...title];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="victory-title letter-stagger" style={!victory ? { color: 'var(--text-dim)', textShadow: 'none' } : undefined}>
        {letters.map((ch, i) => (
          <span key={i} style={{ animationDelay: `${i * 45}ms` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </h3>
      <p className="text-dim" style={{ textAlign: 'center', fontSize: 14.5 }}>
        {victory
          ? 'Has derrotado a El Académico y conquistado la primera veta.'
          : 'Tu concentración se agotó, pero cada reto te hizo más fuerte.'}
      </p>
      <div className="result-grid">
        <div className="panel result-cell">
          <div className="result-value">{run.stats.correct}</div>
          <div className="result-label">Aciertos</div>
        </div>
        <div className="panel result-cell">
          <div className="result-value">×{run.stats.bestCombo}</div>
          <div className="result-label">Mejor combo</div>
        </div>
        <div className="panel result-cell">
          <div className="result-value">◆ {fragmentReward(run, victory)}</div>
          <div className="result-label">Fragmentos</div>
        </div>
        <div className="panel result-cell">
          <div className="result-value">{run.deck.length}</div>
          <div className="result-label">Cartas</div>
        </div>
      </div>
      <button className="btn btn-primary btn-block" onClick={onClose}>
        Volver a la forja
      </button>
    </motion.div>
  );
}
