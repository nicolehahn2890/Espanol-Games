# 🔥 La Forja del Idioma

Un juego web personal para forjar **español de nivel C1/C2**: gramática avanzada y vocabulario
en un *roguelike deckbuilder* con repetición espaciada (FSRS) escondida dentro del combate.

**100 % local y sin servidores**: PWA estática en GitHub Pages, progreso en IndexedDB,
interfaz íntegramente en español.

## Modos de juego

| Modo | Descripción |
|---|---|
| ⚔️ **La Expedición** | Desciende por un mapa de nodos (combates, mercader, fragua, eventos) hasta el jefe **El Académico**. Las cartas son modificadores que juegas *antes* de responder cada reto; los enemigos son dominios gramaticales con personalidad (El Subjuntivo Errante, El Falso Amigo…). |
| ⏳ **Contrarreloj** | 90 segundos de retos encadenados con multiplicador de combo (×1,5 → ×2 → ×3) y récords locales. Quema tu cola de repaso FSRS. |
| 🔮 **El Enigma Diario** | Próximamente. |

Los aciertos y fallos alimentan el planificador **FSRS** (`ts-fsrs`): el juego prioriza en
secreto lo que estás a punto de olvidar.

## Contenido (v1)

240 retos curados a mano en `public/content/`: subjuntivo avanzado, pasados con matiz,
conectores cultos, registro, **falsos amigos alemán–español** (especialidad de la casa),
vocabulario C1/C2 con definiciones monolingües, modismos y colocaciones con trampas de
interferencia alemana. Validados con Zod (`npm run validate-content`).

## Desarrollo

```bash
npm install
npm run dev              # desarrollo local
npm test                 # vitest (motor de combate, mapa, FSRS, combo…)
npm run lint             # eslint
npm run validate-content # valida los packs JSON
npm run build            # tsc + vite build
npm run preview -- --host  # probar la build (necesario para el service worker)
```

### Stack

React 18 + TypeScript estricto · Vite · Zustand · Dexie (IndexedDB) · ts-fsrs ·
Framer Motion + GSAP · canvas-confetti · sonido sintetizado con WebAudio (cero assets) ·
vite-plugin-pwa.

El motor de juego (`src/game/`) es TypeScript puro, determinista por semilla y sin React:
el combate es un *reducer* que emite eventos (`HIT`, `COMBO_UP`…) que la capa visual
convierte en partículas, sacudidas y sonido.

## Despliegue

`.github/workflows/deploy.yml` despliega a GitHub Pages en cada push a `main`
(lint + tests + validación de contenido + build).

**Configuración única**: en el repo, *Settings → Pages → Source: GitHub Actions*.

La app queda en `https://<usuario>.github.io/Espanol-Games/` — en el iPhone:
Safari → Compartir → **Añadir a pantalla de inicio**.

## Copias de seguridad

iOS puede borrar el almacenamiento de webs sin uso prolongado. En **Ajustes → Exportar copia**
descargas un JSON con todo tu progreso (FSRS incluido) que puedes reimportar cuando quieras.

## Hoja de ruta

- [x] Fase 0 — esqueleto, PWA, deploy
- [x] Fase 1 — Contrarreloj + pipeline de contenido + FSRS
- [x] Fase 2 — La Expedición (veta I: 8 enemigos, 12 cartas, mercader, fragua, eventos, jefe)
- [ ] Fase 3 — El Enigma Diario, árbol de maestría, códice completo
- [ ] Fase 4 — vetas II–III, más jefes, ascensión, ~600 retos
