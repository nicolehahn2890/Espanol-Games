# 🎯 Juegos de Español

Minijuegos alegres y sin prisa para **español avanzado (C1/C2)** — una PWA personal, 100 % local
(sin servidores, sin cuentas), con la interfaz íntegramente en español.

## Los cuatro juegos

| Juego | Cómo se juega |
|---|---|
| 🟩 **La Palabra** | Adivina la palabra de 5 letras en 6 intentos (estilo Wordle). Una palabra del día (nivel accesible, nunca rarezas) que alimenta tu racha 🔥 + práctica libre ilimitada. Funciona con el teclado físico en el ordenador. Al resolver: baile de letras, definición y traducción. |
| ❓ **Quiz** | Rondas de 10 preguntas de elección múltiple por tema (vocabulario, gramática, falsos amigos, modismos). Tras cada respuesta, una explicación grande; estrellas y confeti al final. |
| 🃏 **Parejas** | Une cada palabra española con su traducción alemana (o, en difícil, con su significado en español). |
| 🧩 **Grupos** | 16 palabras, 4 categorías ocultas (estilo Connections) — con trampas deliberadas y explicación didáctica al resolver. |

**Sin temporizadores.** Nada mete prisa. La dificultad se elige en cada juego:
😌 Relajado · 🙂 Normal · 🔥 Difícil — y la elección se recuerda.

Los aciertos y fallos del Quiz y de Parejas alimentan el planificador de repetición espaciada
**FSRS** (`ts-fsrs`): la app prioriza en silencio lo que estás a punto de olvidar. La pantalla de
Estadísticas muestra tu memoria por tema.

## Contenido (curado a mano, validado con Zod)

- **320 retos curados**: subjuntivo, pasados, conectores, registro, **falsos amigos
  alemán–español**, modismos, colocaciones con trampas de interferencia alemana, y dos packs de
  vocabulario: uno C2/literario y otro de **C1 útil y cotidiano**
- **+530 ejercicios generados automáticamente** a partir del vocabulario y los modismos
  (definición→palabra, español↔alemán, hueco en frase de ejemplo, modismo→significado), lo que
  da ~850 formas de pregunta en el quiz
- **300 palabras** de 5 letras con definición y glosa alemana para La Palabra
- **45 rompecabezas** de Grupos con explicaciones

El quiz agrupa todas las variantes por palabra: un mismo ítem nunca sale dos veces en una ronda
y cada vez puede aparecer con una forma de ejercicio distinta. Lo respondido en la última media
hora se aparta, así que repetir una categoría no repite las mismas preguntas; Parejas y La
Palabra evitan igualmente el material de las últimas partidas.

`npm run validate-content` comprueba esquemas, ids únicos, referencias cruzadas, que el hueco
de cada frase coincida con la respuesta y que la respuesta no se repita entre los distractores.
Añadir contenido = añadir un JSON en `public/content/` y listarlo en `manifest.json`.

## Estructura del proyecto

```
public/content/        packs JSON de contenido + manifest.json
public/icons/          icono SVG fuente + PNGs generados (npm run generate-icons)
scripts/               validate-content.ts, generate-icons.mjs
src/
  content/             esquemas Zod + cargador con índice en memoria
  db/                  Dexie (IndexedDB) + exportar/importar copia de seguridad
  srs/                 adaptador ts-fsrs (cola de repaso ponderada)
  game/                lógica pura y testeable: wordle, quiz, parejas, grupos,
                       exercises (generador de variantes), dificultad, xp,
                       logros, semillas diarias
  fx/                  audio WebAudio sintetizado, partículas, confeti,
                       sacudidas y puntos flotantes (Web Animations API)
  stores/              Zustand (meta/progreso, ajustes)
  components/ui/       Bar, DifficultyPicker, ExplanationCard, Icon (SVG
                       propios), AchievementToast
  screens/             una pantalla por ruta
tests/                 vitest (lógica de juego)
```

## Diseño

Estética «candy»: tipografías Nunito + Baloo 2, botones y fichas 3D con brillo, paleta viva,
fondo de manchas de color estáticas (sin animación, para no parpadear). Los iconos son SVG
propios (`components/ui/Icon.tsx`), no emojis. La capa `styles/glossy.css` añade los reflejos
sin usar `backdrop-filter` (que parpadeaba en móvil). Todo respeta «reducir animaciones».

Nota de compatibilidad: la base de datos IndexedDB conserva el nombre interno `la-forja`
(de la primera versión de la app) para no perder el progreso guardado.

## Desarrollo

```bash
npm install
npm run dev                # desarrollo local
npm test                   # vitest
npm run lint               # eslint
npm run validate-content   # valida los packs JSON
npm run build              # tsc + vite build
npm run preview -- --host  # probar la build (necesario para el service worker)
```

**Stack**: React 18 + TypeScript estricto · Vite · Zustand · Dexie · ts-fsrs ·
Framer Motion · canvas-confetti · vite-plugin-pwa. Sonido y efectos sin assets:
WebAudio sintetizado y Web Animations API.

## Despliegue

Cada push a `main` ejecuta lint + tests + validación + build y despliega a GitHub Pages
(`.github/workflows/deploy.yml`). Pages está configurado con *Source: GitHub Actions*.

App: `https://nicolehahn2890.github.io/Espanol-Games/` — en el iPhone: Safari → Compartir →
**Añadir a pantalla de inicio**. La app comprueba actualizaciones al volver a abrirla; en
**Ajustes** hay además un botón «Actualizar la app» que fuerza la última versión.

## Copias de seguridad

El progreso vive solo en el dispositivo. En **Ajustes → Exportar copia** se descarga un JSON con
todo (incluido el estado FSRS), reimportable cuando quieras. Conviene exportar de vez en cuando:
iOS puede limpiar el almacenamiento de webs sin uso prolongado.
