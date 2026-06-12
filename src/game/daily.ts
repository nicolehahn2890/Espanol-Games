import { hashString } from './rng';

/** Clave del día local, p. ej. "2026-06-12". */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Semilla determinista para el contenido diario. */
export function dailySeed(key: string, salt = ''): number {
  return hashString(`la-forja:${salt}:${key}`);
}

/** ¿`previous` fue exactamente el día anterior a `current`? */
export function isYesterday(previous: string, current: string): boolean {
  const prev = new Date(`${previous}T12:00:00`);
  prev.setDate(prev.getDate() + 1);
  return todayKey(prev) === current;
}
