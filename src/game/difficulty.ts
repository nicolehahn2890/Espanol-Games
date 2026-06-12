export type DifficultyChoice = 'relajado' | 'normal' | 'dificil';

export const DIFFICULTIES: { id: DifficultyChoice; emoji: string; label: string }[] = [
  { id: 'relajado', emoji: '😌', label: 'Relajado' },
  { id: 'normal', emoji: '🙂', label: 'Normal' },
  { id: 'dificil', emoji: '🔥', label: 'Difícil' },
];

/** Niveles de contenido (campo `difficulty` 1–3) que cubre cada elección. */
export function difficultyLevels(choice: DifficultyChoice): (1 | 2 | 3)[] {
  switch (choice) {
    case 'relajado':
      return [1];
    case 'normal':
      return [1, 2];
    case 'dificil':
      return [2, 3];
  }
}

const KEY = 'la-forja:dificultad';

export function loadDifficulty(): DifficultyChoice {
  const raw = localStorage.getItem(KEY);
  return raw === 'relajado' || raw === 'dificil' ? raw : 'normal';
}

export function saveDifficulty(choice: DifficultyChoice): void {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* sin persistencia */
  }
}
