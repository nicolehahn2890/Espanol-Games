import { create } from 'zustand';
import { db } from '@/db/db';
import { createRun } from '@/game/run/run';
import type { RunState } from '@/game/run/types';

interface RunStore {
  run: RunState | null;
  ready: boolean;
  init: () => Promise<void>;
  startRun: () => RunState;
  /** sustituye el run y lo persiste; null abandona */
  setRun: (run: RunState | null) => void;
  /** mutación in situ + persistencia (el motor ya clona donde hace falta) */
  commit: () => void;
}

function persist(run: RunState | null): void {
  if (run) {
    void db.activeRun.put({ id: 'run', state: structuredClone(run), savedAt: new Date().toISOString() });
  } else {
    void db.activeRun.delete('run');
  }
}

export const useRunStore = create<RunStore>((set, get) => ({
  run: null,
  ready: false,

  init: async () => {
    const saved = await db.activeRun.get('run');
    set({ run: (saved?.state as RunState | undefined) ?? null, ready: true });
  },

  startRun: () => {
    const run = createRun();
    set({ run });
    persist(run);
    return run;
  },

  setRun: (run) => {
    set({ run });
    persist(run);
  },

  commit: () => {
    const { run } = get();
    set({ run: run ? { ...run } : null });
    persist(run);
  },
}));
