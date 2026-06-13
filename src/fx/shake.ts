let reducedMotion = false;

export function setShakeReducedMotion(value: boolean): void {
  reducedMotion = value;
}

/** Sacudida de pantalla sobre #fx-root (Web Animations API, sin dependencias). */
export function screenShake(intensity = 8, duration = 0.25): void {
  if (reducedMotion) return;
  const root = document.getElementById('fx-root');
  if (!root) return;
  const steps = 6;
  const keyframes = Array.from({ length: steps }, (_, i) => {
    const decay = 1 - i / steps;
    const x = (Math.random() * 2 - 1) * intensity * decay;
    const y = (Math.random() * 2 - 1) * intensity * decay * 0.6;
    return { transform: `translate(${x}px, ${y}px)` };
  });
  keyframes.push({ transform: 'translate(0, 0)' });
  root.animate(keyframes, { duration: duration * 1000, easing: 'ease-in-out' });
}

/** Texto que asciende flotando desde un elemento: «+8 XP», «¡Bien!»… */
export function floatPoints(from: Element | null, text: string, color = '#ff9600'): void {
  if (!from) return;
  const rect = from.getBoundingClientRect();
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'fixed',
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top + rect.height * 0.25}px`,
    transform: 'translate(-50%, -50%)',
    fontFamily: "'Fredoka Variable', system-ui, sans-serif",
    fontWeight: '700',
    fontSize: '26px',
    color,
    textShadow: '0 2px 8px rgba(255,255,255,.8)',
    pointerEvents: 'none',
    zIndex: '95',
    whiteSpace: 'nowrap',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  const drift = (Math.random() * 2 - 1) * 36;
  const animation = el.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.7)', opacity: 0 },
      {
        transform: `translate(calc(-50% + ${drift * 0.4}px), -90%) scale(1.2)`,
        opacity: 1,
        offset: 0.35,
      },
      { transform: `translate(calc(-50% + ${drift}px), -170%) scale(1)`, opacity: 0 },
    ],
    { duration: 850, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
  animation.onfinish = () => el.remove();
}
