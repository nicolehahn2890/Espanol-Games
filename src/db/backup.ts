import { z } from 'zod';
import { db, type MetaRecord, type ScoreRecord, type SrsRecord } from './db';

const BACKUP_VERSION = 1;

const backupSchema = z.object({
  app: z.literal('la-forja'),
  version: z.number().int().positive(),
  exportedAt: z.string(),
  srs: z.array(z.unknown()),
  meta: z.unknown().nullable(),
  scores: z.array(z.unknown()),
});

export async function exportBackup(): Promise<string> {
  const [srs, meta, scores] = await Promise.all([
    db.srs.toArray(),
    db.meta.get('meta'),
    db.scores.toArray(),
  ]);
  const payload = {
    app: 'la-forja' as const,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    srs,
    meta: meta ?? null,
    scores,
  };
  if (meta) await db.meta.put({ ...meta, lastBackupAt: payload.exportedAt });
  return JSON.stringify(payload, null, 2);
}

export function downloadBackup(json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `la-forja-copia-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Valida e importa una copia, reemplazando los datos actuales. */
export async function importBackup(json: string): Promise<void> {
  const parsed = backupSchema.parse(JSON.parse(json));
  await db.transaction('rw', [db.srs, db.meta, db.scores], async () => {
    await Promise.all([db.srs.clear(), db.meta.clear(), db.scores.clear()]);
    if (parsed.srs.length) await db.srs.bulkPut(parsed.srs as SrsRecord[]);
    if (parsed.meta) await db.meta.put(parsed.meta as MetaRecord);
    if (parsed.scores.length) await db.scores.bulkPut(parsed.scores as ScoreRecord[]);
  });
}
