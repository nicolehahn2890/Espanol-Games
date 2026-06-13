import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '@/db/db';
import { retrievabilityOf } from '@/srs/fsrs';
import { loadContent } from '@/content/loader';
import { srsItemId, type Domain } from '@/content/schema';
import { useMetaStore } from '@/stores/useMetaStore';
import { levelFromXp, levelProgress, titleForLevel } from '@/game/xp';
import { Bar } from '@/components/ui/Bar';
import { IconGrafico, IconLlama, IconQuiz, IconGrupos } from '@/components/ui/Icon';

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

const DOMAIN_EMOJI: Partial<Record<Domain, string>> = {
  subjuntivo: '🌀',
  pasados: '⏳',
  conectores: '🔗',
  registro: '🎩',
  'falsos-amigos': '🎭',
  'vocab-c1': '📗',
  'vocab-c2': '📕',
  modismos: '🦜',
  colocaciones: '🧲',
};

interface DomainMastery {
  domain: Domain;
  studied: number;
  total: number;
  mastery: number;
}

export function StatsScreen() {
  const meta = useMetaStore((s) => s.meta);
  const [mastery, setMastery] = useState<DomainMastery[]>([]);
  const level = levelFromXp(meta.xp);

  useEffect(() => {
    void (async () => {
      const [content, srsRecords] = await Promise.all([loadContent(), db.srs.toArray()]);
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
            // memoria del tema completo: lo no visto cuenta como 0, así la barra
            // refleja cuánto del tema dominas de verdad (no solo de lo ya visto)
            mastery: e.total > 0 ? e.sum / e.total : 0,
          }))
          .sort((a, b) => b.mastery - a.mastery),
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

      <div className="panel hero-card">
        <div className="hero-icon" style={{ background: 'linear-gradient(180deg,#bd84ff,#8a45dd)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff' }}>
            {level}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{titleForLevel(level)}</div>
          <div className="text-dim" style={{ fontSize: 12.5, marginBottom: 6 }}>
            Nivel {level} · {meta.xp} XP
          </div>
          <Bar value={levelProgress(meta.xp) * 100} max={100} color="gold" />
        </div>
      </div>

      <div className="metric-row">
        <div className="panel metric-card">
          <span className="metric-icon" style={{ color: 'var(--orange)' }}>
            <IconLlama size={24} />
          </span>
          <span className="metric-value">{meta.streak}</span>
          <span className="metric-label">racha (días)</span>
        </div>
        <div className="panel metric-card">
          <span className="metric-icon" style={{ color: 'var(--blue)' }}>
            <IconQuiz size={24} />
          </span>
          <span className="metric-value">{meta.quizRounds ?? 0}</span>
          <span className="metric-label">rondas quiz</span>
        </div>
        <div className="panel metric-card">
          <span className="metric-icon" style={{ color: 'var(--purple)' }}>
            <IconGrupos size={22} />
          </span>
          <span className="metric-value">{(meta.solvedGroupPuzzles ?? []).length}</span>
          <span className="metric-label">grupos</span>
        </div>
      </div>

      <h3 className="section-title">
        <IconGrafico size={20} className="section-ico" /> Tu memoria por tema
      </h3>
      <p className="text-dim" style={{ fontSize: 13, marginTop: 0 }}>
        Cuánto del tema completo recuerdas ahora mismo. Empieza vacía y se llena a medida que juegas
        y retienes las palabras.
      </p>
      {mastery.map((m) => (
        <div key={m.domain} className="panel topic-row">
          <span className="topic-emoji">{DOMAIN_EMOJI[m.domain] ?? '•'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="topic-head">
              <span className="topic-name">{DOMAIN_LABELS[m.domain] ?? m.domain}</span>
              <span className="topic-pct">{Math.round(m.mastery * 100)}%</span>
            </div>
            <Bar value={m.mastery * 100} max={100} color={m.mastery > 0.6 ? 'teal' : 'gold'} />
          </div>
        </div>
      ))}
      {mastery.length === 0 && <p className="text-dim">Aún no hay datos. ¡A jugar!</p>}
    </motion.div>
  );
}
