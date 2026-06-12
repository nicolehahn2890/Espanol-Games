import type { EnemyDef } from './types';

export const ENEMY_DEFS: Record<string, EnemyDef> = Object.fromEntries(
  (
    [
      {
        id: 'subjuntivo-errante',
        name: 'El Subjuntivo Errante',
        epithet: 'Espíritu de los modos confundidos',
        hp: 55,
        attack: 9,
        domains: ['subjuntivo'],
        quirk: null,
        tier: 'normal',
        hue: 174,
      },
      {
        id: 'eco-del-pasado',
        name: 'El Eco del Pasado',
        epithet: 'Murmullo entre indefinido e imperfecto',
        hp: 55,
        attack: 9,
        domains: ['pasados'],
        quirk: null,
        tier: 'normal',
        hue: 262,
      },
      {
        id: 'falso-amigo',
        name: 'El Falso Amigo',
        epithet: 'Embaucador germano-hispano',
        hp: 50,
        attack: 10,
        domains: ['falsos-amigos'],
        quirk: null,
        tier: 'normal',
        hue: 16,
      },
      {
        id: 'tejedor-conectores',
        name: 'El Tejedor de Hilos',
        epithet: 'Anudador de discursos',
        hp: 60,
        attack: 9,
        domains: ['conectores'],
        quirk: null,
        tier: 'normal',
        hue: 210,
      },
      {
        id: 'duende-modismos',
        name: 'El Duende de los Modismos',
        epithet: 'No tiene pelos en la lengua',
        hp: 55,
        attack: 10,
        domains: ['modismos'],
        quirk: null,
        tier: 'normal',
        hue: 95,
      },
      {
        id: 'golem-colocaciones',
        name: 'El Gólem de las Colocaciones',
        epithet: 'Toma decisiones, no las hace',
        hp: 60,
        attack: 10,
        domains: ['colocaciones'],
        quirk: null,
        tier: 'normal',
        hue: 35,
      },
      {
        id: 'quimera-sinonimos',
        name: 'La Quimera de Sinónimos',
        epithet: 'Cada fallo la alimenta',
        hp: 85,
        attack: 12,
        domains: ['vocab-c1', 'vocab-c2'],
        quirk: 'heal-on-miss',
        quirkText: 'Cuando fallas, recupera 6 PV.',
        tier: 'elite',
        hue: 290,
      },
      {
        id: 'academico',
        name: 'El Académico',
        epithet: 'Guardián de la primera veta',
        hp: 150,
        attack: 12,
        domains: ['registro', 'colocaciones', 'conectores'],
        quirk: 'enrage',
        quirkText: 'Al quedar por debajo de la mitad de PV, su ataque crece un 50 %.',
        tier: 'jefe',
        hue: 48,
      },
    ] satisfies EnemyDef[]
  ).map((e) => [e.id, e]),
);

export const NORMAL_ENEMIES = Object.values(ENEMY_DEFS)
  .filter((e) => e.tier === 'normal')
  .map((e) => e.id);

export const ELITE_ENEMIES = Object.values(ENEMY_DEFS)
  .filter((e) => e.tier === 'elite')
  .map((e) => e.id);

export const FLOOR_BOSSES = ['academico'];
