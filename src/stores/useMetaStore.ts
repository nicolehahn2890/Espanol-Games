import { create } from 'zustand';
import { db, DEFAULT_META, loadMeta, type MetaRecord } from '@/db/db';
import { levelFromXp } from '@/game/xp';
import { ACHIEVEMENT_MAP } from '@/game/achievements';
import { sfx } from '@/fx/audio';
import { celebrateSmall } from '@/fx/celebrate';

interface MetaStore {
  meta: MetaRecord;
  ready: boolean;
  /** logro recién desbloqueado, para el toast */
  lastAchievement: string | null;
  init: () => Promise<void>;
  update: (patch: Partial<MetaRecord>) => void;
  /** suma xp; devuelve true si se subió de nivel */
  addXp: (amount: number) => boolean;
  addFragmentos: (amount: number) => void;
  unlock: (achievementId: string) => void;
  discover: (collectionId: string) => void;
  clearAchievementToast: () => void;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist(meta: MetaRecord): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => void db.meta.put(meta), 250);
}

export const useMetaStore = create<MetaStore>((set, get) => ({
  meta: DEFAULT_META,
  ready: false,
  lastAchievement: null,

  init: async () => {
    const meta = await loadMeta();
    set({ meta, ready: true });
  },

  update: (patch) => {
    const meta = { ...get().meta, ...patch };
    set({ meta });
    persist(meta);
  },

  addXp: (amount) => {
    const before = levelFromXp(get().meta.xp);
    const xp = get().meta.xp + amount;
    get().update({ xp });
    const after = levelFromXp(xp);
    if (after > before) {
      sfx('levelUp');
      celebrateSmall();
      if (after >= 10) get().unlock('nivel-10');
      return true;
    }
    return false;
  },

  addFragmentos: (amount) => {
    get().update({ fragmentos: get().meta.fragmentos + amount });
  },

  unlock: (achievementId) => {
    const { meta } = get();
    if (!ACHIEVEMENT_MAP.has(achievementId) || meta.achievements.includes(achievementId)) return;
    get().update({ achievements: [...meta.achievements, achievementId] });
    set({ lastAchievement: achievementId });
    sfx('achievement');
    celebrateSmall();
  },

  discover: (collectionId) => {
    const { meta } = get();
    if (meta.collection.includes(collectionId)) return;
    const collection = [...meta.collection, collectionId];
    get().update({ collection });
    if (collection.filter((c) => c.startsWith('card:')).length >= 10) {
      get().unlock('coleccionista');
    }
  },

  clearAchievementToast: () => set({ lastAchievement: null }),
}));
