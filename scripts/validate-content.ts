/**
 * Valida todos los packs de contenido contra el esquema Zod y comprueba que
 * ningún id se repita entre packs. Falla con exit code 1 si algo no cuadra.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifestSchema, packSchema } from '../src/content/schema';

const contentDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/content');

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(resolve(contentDir, name), 'utf8'));
}

const manifest = manifestSchema.parse(readJson('manifest.json'));
const seen = new Map<string, string>();
let total = 0;
let failed = false;

for (const packName of manifest.packs) {
  try {
    const pack = packSchema.parse(readJson(`${packName}.json`));
    const ids = [
      ...(pack.challenges ?? []).map((c) => c.id),
      ...(pack.vocab ?? []).map((v) => v.id),
      ...(pack.idioms ?? []).map((i) => i.id),
      ...(pack.collocations ?? []).map((c) => c.id),
      ...(pack.grammarTopics ?? []).map((g) => g.id),
      ...(pack.wordleWords ?? []).map((w) => w.id),
      ...(pack.groupPuzzles ?? []).map((p) => p.id),
    ];
    for (const id of ids) {
      const where = seen.get(id);
      if (where) {
        console.error(`✗ id duplicado «${id}» en ${packName} (ya estaba en ${where})`);
        failed = true;
      }
      seen.set(id, packName);
    }
    // los itemRef deben apuntar a ids existentes dentro del conjunto completo
    total += pack.challenges?.length ?? 0;
    console.log(`✓ ${packName}: ${ids.length} ids, ${pack.challenges?.length ?? 0} retos`);
  } catch (error) {
    console.error(`✗ ${packName}:`, error instanceof Error ? error.message : error);
    failed = true;
  }
}

// segunda pasada: referencias cruzadas y coherencia de los retos
for (const packName of manifest.packs) {
  try {
    const pack = packSchema.parse(readJson(`${packName}.json`));
    for (const ch of pack.challenges ?? []) {
      if (ch.itemRef && !seen.has(ch.itemRef)) {
        console.error(`✗ ${packName}: ${ch.id} apunta a itemRef inexistente «${ch.itemRef}»`);
        failed = true;
      }
      const answer = ch.answer.trim().toLowerCase();
      if ((ch.distractors ?? []).some((d) => d.trim().toLowerCase() === answer)) {
        console.error(`✗ ${packName}: ${ch.id} repite la respuesta entre los distractores`);
        failed = true;
      }
      const gap = ch.sentence.match(/\{([^}]+)\}/)?.[1];
      if (gap !== ch.answer) {
        console.error(`✗ ${packName}: ${ch.id} el hueco «${gap}» no coincide con la respuesta`);
        failed = true;
      }
    }
    for (const topic of pack.grammarTopics ?? []) {
      for (const id of topic.challengeIds) {
        if (!seen.has(id)) {
          console.error(`✗ ${packName}: ${topic.id} apunta a reto inexistente «${id}»`);
          failed = true;
        }
      }
    }
  } catch {
    /* ya notificado arriba */
  }
}

console.log(`\nTotal: ${total} retos, ${seen.size} ids únicos.`);
if (failed) process.exit(1);
console.log('Contenido válido ✨');
