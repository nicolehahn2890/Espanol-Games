import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, type ScoreRecord } from '@/db/db';
import { retrievabilityOf } from '@/srs/fsrs';
import { loadContent } from '@/content/loader';
import { srsItemId, type Domain } from '@/content/schema';
import { useMetaStore } from '@/stores/useMetaStore';
import { levelFromXp, titleForLevel } from '@/game/xp';
import { Bar } from '@/components/ui/Bar';

const DOMAIN_LABELS: Partial<Record<Domain, string>> = {
  subjuntivo: 'Subjuntivo',
  pasados: 'Pasados',
  conectores: 'Conectores',
  registro: 'Registro',
  'falsos-amigos': 'Falsos amigos',
  'vocab-c1': 'Vocabulario C1',
  'vocab-c2': 'Vocabulario C2',
  modismos: 'Modismos',
  colocaciones: 'Colocaciones',
};

interface DomainMastery {
  domain: Domain;
  studied: number;
  total: number;
  mastery: number;
}

export function StatsScreen() {
  const meta = useMetaStore((s) => s.meta);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [mastery, setMastery] = useState<DomainMastery[]>([]);
  const level = levelFromXp(meta.xp);

  useEffect(() => {
    void (async () => {
      const [content, srsRecords, blitz] = await Promise.all([
        loadContent(),
        db.srs.toArray(),
        db.scores.where('mode').equals('blitz').reverse().sortBy('score'),
      ]);
      setScores(blitz.slice(0, 5));
      const byItem = new Map(srsRecords.map((r) => [r.itemId, r]));
      const acc = new Map<Domain, { sum: number; studied: number; total: number }>();
      for (const ch of content.challenges.values()) {
        const entry = acc.get(ch.domain) ?? { sum: 0, studied: 0, total: 0 };
        entry.total += 1;
        const record = byItem.get(srsItemId(ch));
        if (record) {
          entry.studied += 1;
          entry.sum += retrievabilityOf(record);
        }
        acc.set(ch.domain, entry);
      }
      setMastery(
        [...acc.entries()]
          .map(([domain, e]) => ({
            domain,
            studied: e.studied,
            total: e.total,
            mastery: e.studied > 0 ? e.sum / e.studied : 0,
          }))
          .sort((a, b) => b.studied - a.studied),
      );
    })();
  }, []);

  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="screen-header">
        <Link className="back-btn" to="/">
          ‹
        </Link>
        <h2>Estadísticas</h2>
      </div>

      <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
        <strong>
          Nivel {level} · <span className="text-gold">{titleForLevel(level)}</span>
        </strong>
        <div className="text-dim" style={{ fontSize: 13.5, marginTop: 4 }}>
          {meta.xp} XP · ◆ {meta.fragmentos} fragmentos · mejor combo ×{meta.bestCombo}
          <br />
          Expediciones: {meta.runsWon} ganadas de {meta.runsPlayed}
        </div>
      </div>

      <h3 style={{ fontSize: 17, margin: '6px 0 10px' }}>Maestría por dominio</h3>
      {mastery.map((m) => (
        <div key={m.domain} className="panel" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <div className="hud-row" style={{ margin: 0 }}>
            <span style={{ fontSize: 14 }}>{DOMAIN_LABELS[m.domain] ?? m.domain}</span>
            <span className="text-dim" style={{ fontSize: 12 }}>
              {m.studied}/{m.total} estudiados
            </span>
          </div>
          <Bar value={m.mastery * 100} max={100} color={m.mastery > 0.7 ? 'teal' : 'gold'} />
        </div>
      ))}
      {mastery.length === 0 && <p className="text-dim">Aún no hay datos. ¡A forjar!</p>}

      {scores.length > 0 && (
        <>
          <h3 style={{ fontSize: 17, margin: '16px 0 10px' }}>Mejores Contrarreloj</h3>
          {scores.map((s, i) => (
            <div key={s.id} className="panel list-row">
              <span className="text-gold" style={{ fontWeight: 700 }}>
                #{i + 1}
              </span>
              <span className="mono" style={{ flex: 1 }}>
                {s.score} pts
              </span>
              <span className="text-dim" style={{ fontSize: 12.5 }}>
                ×{s.maxCombo} · {s.correct}/{s.answered} · {s.date.slice(0, 10)}
              </span>
            </div>
          ))}
        </>
      )}
    </motion.div>
  );
}
