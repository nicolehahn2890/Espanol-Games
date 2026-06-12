# 🎯 Juegos de Español

Minijuegos alegres y sin prisa para **español de nivel C1/C2** — una PWA personal, 100 % local
(sin servidores, sin cuentas), con la interfaz íntegramente en español.

## Los cuatro juegos

| Juego | Cómo se juega |
|---|---|
| 🟩 **La Palabra** | Adivina la palabra de 5 letras en 6 intentos (estilo Wordle). Una palabra del día que alimenta tu racha 🔥 + práctica libre ilimitada. Al terminar ves la definición y la traducción. |
| ❓ **Quiz** | Rondas de 10 preguntas de elección múltiple por tema (vocabulario, gramática, falsos amigos, modismos). Tras cada respuesta, una explicación grande y clara. Estrellas al final. |
| 🃏 **Parejas** | Une cada palabra española con su traducción alemana (o, en difícil, con su significado en español). |
| 🧩 **Grupos** | 16 palabras, 4 categorías ocultas (estilo Connections) — con trampas deliberadas y explicación didáctica al resolver. |

**Sin temporizadores.** Nada mete prisa. La dificultad se elige en cada juego:
😌 Relajado · 🙂 Normal · 🔥 Difícil.

Los aciertos y fallos del Quiz y de Parejas alimentan el planificador de repetición espaciada
**FSRS** (`ts-fsrs`): la app prioriza en silencio lo que estás a punto de olvidar. La pantalla de
Estadísticas muestra tu memoria por tema.

## Contenido (curado a mano, validado con Zod)

- 240 retos C1/C2: subjuntivo, pasados, conectores, registro, **falsos amigos alemán–español**,
  vocabulario con definiciones monolingües y glosas alemanas, modismos, colocaciones
- 300 palabras de 5 letras con definición para La Palabra
- 45 rompecabezas de Grupos con explicaciones

`npm run validate-content` comprueba esquemas, ids únicos y referencias.

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

**Stack**: React 18 + TypeScript estricto · Vite · Zustand · Dexie (IndexedDB) · ts-fsrs ·
Framer Motion · canvas-confetti · sonido sintetizado con WebAudio (cero assets) · vite-plugin-pwa.

## Despliegue

Cada push a `main` ejecuta lint + tests + validación + build y despliega a GitHub Pages
(`.github/workflows/deploy.yml`). Requiere *Settings → Pages → Source: GitHub Actions* (ya
configurado).

App: `https://nicolehahn2890.github.io/Espanol-Games/` — en el iPhone: Safari → Compartir →
**Añadir a pantalla de inicio**.

## Copias de seguridad

El progreso vive solo en el dispositivo. En **Ajustes → Exportar copia** se descarga un JSON con
todo (incluido el estado FSRS), reimportable cuando quieras. Conviene exportar de vez en cuando:
iOS puede limpiar el almacenamiento de webs sin uso prolongado.
