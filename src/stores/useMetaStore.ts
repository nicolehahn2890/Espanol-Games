import { create } from 'zustand';
import { db, DEFAULT_META, loadMeta, type MetaRecord } from '@/db/db';
import { levelFromXp } from '@/game/xp';
import { isYesterday, todayKey } from '@/game/daily';
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
  unlock: (achievementId: string) => void;
  /** registra la Palabra del día completada y actualiza la racha */
  markDailyDone: () => void;
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
      if (after >= 5) get().unlock('nivel-5');
      if (after >= 10) get().unlock('nivel-10');
      if (after >= 25) get().unlock('nivel-25');
      return true;
    }
    return false;
  },

  unlock: (achievementId) => {
    const { meta } = get();
    if (!ACHIEVEMENT_MAP.has(achievementId) || meta.achievements.includes(achievementId)) return;
    get().update({ achievements: [...meta.achievements, achievementId] });
    set({ lastAchievement: achievementId });
    sfx('achievement');
    celebrateSmall();
  },

  markDailyDone: () => {
    const { meta } = get();
    const today = todayKey();
    if (meta.lastDailyDate === today) return;
    const streak =
      meta.lastDailyDate && isYesterday(meta.lastDailyDate, today) ? meta.streak + 1 : 1;
    get().update({ streak, lastDailyDate: today });
    if (streak >= 3) get().unlock('racha-3');
    if (streak >= 7) get().unlock('racha-7');
    if (streak >= 30) get().unlock('racha-30');
  },

  clearAchievementToast: () => set({ lastAchievement: null }),
}));
