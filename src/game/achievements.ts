export interface AchievementDef {
  id: string;
  name: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'primer-golpe',
    name: 'Primer Paso',
    description: 'Responde correctamente tu primer reto.',
  },
  {
    id: 'palabra-1',
    name: 'Adivina Adivinanza',
    description: 'Resuelve tu primera Palabra del día.',
  },
  {
    id: 'palabra-genio',
    name: 'A la Primera',
    description: 'Acierta la Palabra en 2 intentos o menos.',
  },
  { id: 'racha-3', name: 'Calentando', description: 'Mantén una racha de 3 días.' },
  { id: 'racha-7', name: 'Semana de Fuego', description: 'Mantén una racha de 7 días.' },
  { id: 'racha-30', name: 'Bibliófila', description: 'Mantén una racha de 30 días.' },
  { id: 'quiz-perfecto', name: 'Matrícula de Honor', description: 'Termina un quiz con 10 de 10.' },
  { id: 'quiz-10', name: 'Preguntona', description: 'Completa 10 rondas de quiz.' },
  {
    id: 'parejas-limpio',
    name: 'Memoria de Elefante',
    description: 'Resuelve un tablero de parejas sin fallos.',
  },
  { id: 'grupos-1', name: 'Conectada', description: 'Resuelve tu primer rompecabezas de grupos.' },
  {
    id: 'grupos-limpio',
    name: 'Mente Brillante',
    description: 'Resuelve un rompecabezas de grupos sin errores.',
  },
  {
    id: 'grupos-10',
    name: 'Tejedora de Ideas',
    description: 'Resuelve 10 rompecabezas de grupos.',
  },
  { id: 'nivel-5', name: 'Chispa Tenaz', description: 'Alcanza el nivel 5.' },
  { id: 'nivel-10', name: 'Cazadora de Palabras', description: 'Alcanza el nivel 10.' },
  { id: 'nivel-25', name: 'Artesana del Idioma', description: 'Alcanza el nivel 25.' },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
