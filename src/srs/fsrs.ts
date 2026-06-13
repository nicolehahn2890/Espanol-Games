import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';
import { db, type FsrsCardSnapshot, type SrsRecord } from '@/db/db';

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 36500,
    enable_fuzz: true,
  }),
);

export { Rating };

export function cardToSnapshot(card: Card): FsrsCardSnapshot {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  };
}

export function snapshotToCard(snapshot: FsrsCardSnapshot): Card {
  return {
    ...snapshot,
    due: new Date(snapshot.due),
    last_review: snapshot.last_review ? new Date(snapshot.last_review) : undefined,
  } as Card;
}

/**
 * Registra una valoración para un ítem y persiste el nuevo estado FSRS.
 * Crea la tarjeta si el ítem aún no se había estudiado.
 */
export async function rate(
  itemId: string,
  rating: Grade,
  mode: SrsRecord['history'][number]['mode'],
  now: Date = new Date(),
): Promise<void> {
  const existing = await db.srs.get(itemId);
  const card = existing ? snapshotToCard(existing.card) : createEmptyCard(now);
  const { card: next } = scheduler.next(card, now, rating);
  const history = existing?.history ?? [];
  history.push({ ts: now.toISOString(), rating, mode });
  await db.srs.put({ itemId, card: cardToSnapshot(next), history: history.slice(-200) });
}

/** Probabilidad de recuerdo ahora (0–1); 0 para ítems nunca vistos. */
export function retrievabilityOf(record: SrsRecord, now: Date = new Date()): number {
  const r = scheduler.get_retrievability(snapshotToCard(record.card), now, false);
  return typeof r === 'number' ? r : 0;
}

export interface DueInfo {
  itemId: string;
  /** menor = más urgente */
  retrievability: number;
  isNew: boolean;
}

/**
 * Cola de repaso: ítems estudiados ordenados por urgencia (retrievability
 * ascendente). Los ítems de `allIds` nunca vistos se devuelven como nuevos.
 */
export async function getDueQueue(allIds: string[], now: Date = new Date()): Promise<DueInfo[]> {
  const records = await db.srs.bulkGet(allIds);
  const queue: DueInfo[] = [];
  for (let i = 0; i < allIds.length; i++) {
    const record = records[i];
    if (record) {
      queue.push({
        itemId: allIds[i],
        retrievability: retrievabilityOf(record, now),
        isNew: false,
      });
    } else {
      queue.push({ itemId: allIds[i], retrievability: 0, isNew: true });
    }
  }
  // primero lo olvidado, después lo nuevo, al final lo bien sabido
  return queue.sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? 1 : -1;
    return a.retrievability - b.retrievability;
  });
}

/**
 * Selección ponderada para combates: mezcla repaso urgente con material nuevo.
 * Devuelve hasta `count` ids, ~70% repaso pendiente y ~30% nuevo.
 */
export async function pickWeighted(
  allIds: string[],
  count: number,
  now: Date = new Date(),
): Promise<string[]> {
  const queue = await getDueQueue(allIds, now);
  const due = queue.filter((q) => !q.isNew && q.retrievability < 0.9);
  const fresh = queue.filter((q) => q.isNew);
  const known = queue.filter((q) => !q.isNew && q.retrievability >= 0.9);
  const picked: string[] = [];
  const wantDue = Math.ceil(count * 0.7);
  picked.push(...due.slice(0, wantDue).map((q) => q.itemId));
  for (const pool of [fresh, known]) {
    for (const q of pool) {
      if (picked.length >= count) break;
      picked.push(q.itemId);
    }
  }
  return picked.slice(0, count);
}
