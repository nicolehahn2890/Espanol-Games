import Dexie, { type EntityTable } from 'dexie';

/** Instantánea serializable de una Card de ts-fsrs (fechas como ISO). */
export interface FsrsCardSnapshot {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export interface SrsRecord {
  itemId: string;
  card: FsrsCardSnapshot;
  /** los modos antiguos (expedicion/diario/blitz) se conservan por compatibilidad */
  history: {
    ts: string;
    rating: 1 | 2 | 3 | 4;
    mode: 'quiz' | 'parejas' | 'expedicion' | 'diario' | 'blitz';
  }[];
}

export interface MetaRecord {
  id: 'meta';
  xp: number;
  fragmentos: number;
  /** ids de logros desbloqueados */
  achievements: string[];
  /** reservado (códice de la versión anterior) */
  collection: string[];
  /** racha de la Palabra del día */
  streak: number;
  streakFreezes: number;
  lastDailyDate?: string;
  runsWon: number;
  runsPlayed: number;
  bestCombo: number;
  createdAt: string;
  lastBackupAt?: string;
  /** rompecabezas de grupos resueltos */
  solvedGroupPuzzles?: string[];
  /** rondas de quiz completadas */
  quizRounds?: number;
}

export interface ScoreRecord {
  id?: number;
  mode: 'quiz' | 'blitz';
  score: number;
  maxCombo: number;
  answered: number;
  correct: number;
  date: string;
}

// El nombre interno «la-forja» se mantiene aunque la app se llame distinto:
// cambiarlo borraría el progreso guardado en IndexedDB.
export const db = new Dexie('la-forja') as Dexie & {
  srs: EntityTable<SrsRecord, 'itemId'>;
  meta: EntityTable<MetaRecord, 'id'>;
  scores: EntityTable<ScoreRecord, 'id'>;
};

db.version(1).stores({
  srs: 'itemId',
  meta: 'id',
  activeRun: 'id',
  scores: '++id, mode, score',
});

// v2: elimina la tabla del modo expedición retirado
db.version(2).stores({ activeRun: null });

export const DEFAULT_META: MetaRecord = {
  id: 'meta',
  xp: 0,
  fragmentos: 0,
  achievements: [],
  collection: [],
  streak: 0,
  streakFreezes: 0,
  runsWon: 0,
  runsPlayed: 0,
  bestCombo: 0,
  createdAt: new Date().toISOString(),
};

export async function loadMeta(): Promise<MetaRecord> {
  const existing = await db.meta.get('meta');
  if (existing) return existing;
  await db.meta.put(DEFAULT_META);
  return DEFAULT_META;
}

/** Pide almacenamiento persistente para reducir el riesgo de borrado en iOS. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    /* opcional */
  }
}
