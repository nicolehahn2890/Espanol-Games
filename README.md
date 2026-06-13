# 🎯 Juegos de Español

Minijuegos alegres y sin prisa para **español avanzado (C1/C2)** — una PWA personal, 100 % local
(sin servidores, sin cuentas), con la interfaz íntegramente en español.

## Los cuatro juegos

| Juego             | Cómo se juega                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🟩 **La Palabra** | Adivina la palabra de 5 letras en 6 intentos (estilo Wordle). Una palabra del día (nivel accesible, nunca rarezas) que alimenta tu racha 🔥 + práctica libre ilimitada. Funciona con el teclado físico en el ordenador. Al resolver: baile de letras, definición y traducción. |
| ❓ **Quiz**       | Rondas de 10 preguntas de elección múltiple por tema (vocabulario, gramática, falsos amigos, modismos). Tras cada respuesta, una explicación grande; estrellas y confeti al final.                                                                                             |
| 🃏 **Parejas**    | Une cada palabra española con su traducción alemana (o, en difícil, con su significado en español).                                                                                                                                                                            |
| 🧩 **Grupos**     | 16 palabras, 4 categorías ocultas (estilo Connections) — con trampas deliberadas y explicación didáctica al resolver.                                                                                                                                                          |

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

Tema **«Joya»**: Candy Crush en modo oscuro. Tablero de lila profundo con focos de luz,
paneles de vidrio esmerilado (frosted glass), fichas y botones tipo gema con halo, y logotipo
de marca dorado→rosa con resplandor.

- **Tipografía**: Fredoka (titulares, redondeada y pop) + Plus Jakarta Sans (texto), en claro
  sobre el fondo oscuro.
- **Color**: superficies lila oscuro + texto claro; se conserva la paleta de caramelo
  (verde/azul/morado/naranja/amarillo/rojo) para fichas, botones y estados.
- **Logo**: burbuja de diálogo con la Ñ (`LogoBubble` en `components/ui/Icon.tsx`); todos los
  iconos son SVG propios, no emojis.
- **Capas de estilo**: `tokens.css` (variables) → `base.css` → `components.css` → `glossy.css`
  (brillo 3D) → **`joya.css`** (re-skin oscuro, importado el último en `main.tsx`). Para volver
  al tema claro basta con quitar esa última importación.
- **Brillo**: sobre el vidrio oscuro, `joya.css` cambia el reflejo recto de las fichas
  (`.pair-card`, `.group-word`, `.option-btn`, …) por un brillo ovalado que se difumina, para que
  no aparezca una raya a media altura. Las tarjetas de Logros usan el mismo vidrio que Estadísticas.
- **Responsive**: verificado sin solapamientos a 360 y 390 px en los cuatro juegos.
- Todo respeta la opción «reducir animaciones».

La barra de estado de iOS y el color de arranque de la PWA (`index.html`, manifest en
`vite.config.ts`) usan el lila oscuro `#1d0a3e` para que el tema sea coherente desde el inicio.

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
(`.github/workflows/deploy.yml`). Pages está configurado con _Source: GitHub Actions_.

App: `https://nicolehahn2890.github.io/Espanol-Games/` — en el iPhone: Safari → Compartir →
**Añadir a pantalla de inicio**.

**Actualizaciones**: el service worker usa **NetworkFirst** para la navegación, así que estando
en línea siempre se carga la última versión (el caché es solo respaldo offline). Además la app
comprueba actualizaciones al volver a abrirla y hay un botón «Actualizar la app» en **Ajustes**.
La primera vez tras cambiar este mecanismo puede hacer falta limpiar los datos del sitio una vez
(o reinstalar el icono en iOS) para soltar el service worker antiguo.

## Copias de seguridad

El progreso vive solo en el dispositivo. En **Ajustes → Exportar copia** se descarga un JSON con
todo (incluido el estado FSRS), reimportable cuando quieras. Conviene exportar de vez en cuando:
iOS puede limpiar el almacenamiento de webs sin uso prolongado.
