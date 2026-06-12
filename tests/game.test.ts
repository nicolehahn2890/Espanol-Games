import { describe, expect, it } from 'vitest';
import { comboMultiplier, isComboTierUp, speedBonus } from '@/game/combo';
import { levelFromXp, levelProgress, titleForLevel, xpForLevel } from '@/game/xp';
import { generateMap } from '@/game/run/map';
import { createRun, selectableNodeIds, fragmentReward } from '@/game/run/run';
import { mulberry32, hashString } from '@/game/rng';
import { blitzPoints } from '@/game/blitz';

describe('combo', () => {
  it('escala ×1 → ×1.5 → ×2 → ×3', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(2)).toBe(1);
    expect(comboMultiplier(3)).toBe(1.5);
    expect(comboMultiplier(6)).toBe(2);
    expect(comboMultiplier(10)).toBe(3);
    expect(comboMultiplier(99)).toBe(3);
  });

  it('detecta las subidas de nivel de combo', () => {
    expect(isComboTierUp(3)).toBe(true);
    expect(isComboTierUp(4)).toBe(false);
    expect(isComboTierUp(0)).toBe(false);
  });

  it('bono de velocidad entre 1.0 y 1.5', () => {
    expect(speedBonus(20, 20)).toBe(1.5);
    expect(speedBonus(0, 20)).toBe(1);
    expect(speedBonus(10, 20)).toBe(1.25);
  });
});

describe('xp', () => {
  it('la curva es monótona y arranca en 0', () => {
    expect(xpForLevel(1)).toBe(0);
    for (let n = 2; n <= 60; n++) {
      expect(xpForLevel(n)).toBeGreaterThan(xpForLevel(n - 1));
    }
  });

  it('nivel y progreso coherentes', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(10))).toBe(10);
    expect(levelProgress(0)).toBe(0);
    expect(titleForLevel(60)).toBe('Maestra Forjadora');
  });
});

describe('mapa', () => {
  it('es determinista por semilla', () => {
    const a = generateMap(123);
    const b = generateMap(123);
    expect(a).toEqual(b);
    expect(generateMap(124)).not.toEqual(a);
  });

  it('tiene 8 capas, termina en jefe y todos los nodos alcanzan la siguiente capa', () => {
    const map = generateMap(7);
    const layers = new Set(map.nodes.map((n) => n.layer));
    expect(layers.size).toBe(8);
    const last = map.nodes.filter((n) => n.layer === 7);
    expect(last).toHaveLength(1);
    expect(last[0].type).toBe('jefe');
    for (const node of map.nodes.filter((n) => n.layer < 7)) {
      expect(node.next.length).toBeGreaterThan(0);
    }
  });
});

describe('run', () => {
  it('empieza en el mapa con el mazo inicial y 100 de concentración', () => {
    const run = createRun(99);
    expect(run.phase).toBe('mapa');
    expect(run.deck).toHaveLength(10);
    expect(run.concentracion).toBe(100);
    expect(selectableNodeIds(run)).toEqual(run.map.startIds);
  });

  it('la victoria da más fragmentos que la derrota', () => {
    const run = createRun(99);
    run.currentNodeId = run.map.nodes.find((n) => n.type === 'jefe')!.id;
    run.stats.correct = 20;
    expect(fragmentReward(run, true)).toBeGreaterThan(fragmentReward(run, false));
  });
});

describe('rng', () => {
  it('mulberry32 es determinista y uniforme en [0,1)', () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    for (let i = 0; i < 100; i++) {
      const va = a();
      expect(va).toBe(b());
      expect(va).toBeGreaterThanOrEqual(0);
      expect(va).toBeLessThan(1);
    }
  });

  it('hashString es estable', () => {
    expect(hashString('hola')).toBe(hashString('hola'));
    expect(hashString('hola')).not.toBe(hashString('holb'));
  });
});

describe('blitz', () => {
  it('puntúa con combo y velocidad', () => {
    expect(blitzPoints(1, 10)).toBe(100);
    expect(blitzPoints(3, 3)).toBe(Math.round(100 * 1.5 * 1.5));
  });
});
