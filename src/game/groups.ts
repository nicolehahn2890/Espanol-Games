import type { GroupPuzzle } from '@/content/schema';
import type { DifficultyChoice } from './difficulty';
import { difficultyLevels } from './difficulty';
import { mulberry32, shuffle } from './rng';

export const MAX_MISTAKES = 4;

/** Siguiente rompecabezas sin resolver para la dificultad elegida. */
export function nextPuzzle(
  puzzles: GroupPuzzle[],
  solvedIds: string[],
  difficulty: DifficultyChoice,
): GroupPuzzle | null {
  const levels = new Set<number>(difficultyLevels(difficulty));
  const solved = new Set(solvedIds);
  const pool = puzzles.filter((p) => levels.has(p.difficulty));
  const unsolved = pool.find((p) => !solved.has(p.id));
  if (unsolved) return unsolved;
  // todos resueltos: rota por el conjunto en vez de repetir siempre el primero
  if (pool.length > 0) return pool[solvedIds.length % pool.length];
  return puzzles[0] ?? null;
}

/** Baraja las 16 palabras de forma determinista por rompecabezas. */
export function shuffledWords(puzzle: GroupPuzzle, salt = 0): string[] {
  const rng = mulberry32((salt + puzzle.id.length * 7 + hash(puzzle.id)) >>> 0);
  return shuffle(
    rng,
    puzzle.groups.flatMap((g) => g.words),
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/** Índice del grupo al que pertenece una selección completa, o null. */
export function matchGroup(puzzle: GroupPuzzle, selection: string[]): number | null {
  const set = new Set(selection.map((w) => w.toLowerCase()));
  for (let i = 0; i < puzzle.groups.length; i++) {
    if (puzzle.groups[i].words.every((w) => set.has(w.toLowerCase()))) return i;
  }
  return null;
}

/** ¿La selección está a una sola palabra de un grupo? («¡Casi!») */
export function isOneAway(puzzle: GroupPuzzle, selection: string[]): boolean {
  const set = new Set(selection.map((w) => w.toLowerCase()));
  return puzzle.groups.some((g) => g.words.filter((w) => set.has(w.toLowerCase())).length === 3);
}

export function groupsXp(solvedGroups: number, mistakes: number, won: boolean): number {
  return solvedGroups * 8 + (won ? Math.max(0, (MAX_MISTAKES - mistakes) * 6) : 0);
}
