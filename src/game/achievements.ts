export interface AchievementDef {
  id: string;
  name: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primer-golpe', name: 'Primer Golpe', description: 'Responde correctamente tu primer reto.' },
  { id: 'racha-de-fuego', name: 'Racha de Fuego', description: 'Alcanza un combo de 10.' },
  { id: 'mil-puntos', name: 'Forja Encendida', description: 'Supera 1000 puntos en Contrarreloj.' },
  { id: 'tres-mil', name: 'Acero Templado', description: 'Supera 3000 puntos en Contrarreloj.' },
  { id: 'primera-victoria', name: 'La Primera Veta', description: 'Gana tu primera expedición.' },
  { id: 'sin-macula', name: 'Sin Mácula', description: 'Derrota a un jefe sin fallar ni una vez.' },
  { id: 'cazatraidores', name: 'Cazatraidores', description: 'Derrota a El Falso Amigo.' },
  { id: 'nivel-10', name: 'Forjadora de Palabras', description: 'Alcanza el nivel 10.' },
  { id: 'coleccionista', name: 'Coleccionista', description: 'Descubre 10 cartas distintas.' },
  { id: 'perseverante', name: 'Perseverante', description: 'Juega 5 expediciones.' },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
