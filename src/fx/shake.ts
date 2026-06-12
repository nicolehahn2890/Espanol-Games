import { gsap } from 'gsap';

let reducedMotion = false;

export function setShakeReducedMotion(value: boolean): void {
  reducedMotion = value;
}

/** Sacudida de pantalla sobre #fx-root. intensity en px. */
export function screenShake(intensity = 8, duration = 0.25): void {
  if (reducedMotion) return;
  const root = document.getElementById('fx-root');
  if (!root) return;
  gsap.killTweensOf(root);
  const tl = gsap.timeline({ onComplete: () => gsap.set(root, { x: 0, y: 0 }) });
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const decay = 1 - i / steps;
    tl.to(root, {
      x: (Math.random() * 2 - 1) * intensity * decay,
      y: (Math.random() * 2 - 1) * intensity * decay * 0.6,
      duration: duration / steps,
      ease: 'power1.inOut',
    });
  }
  tl.to(root, { x: 0, y: 0, duration: duration / steps });
}

/** Destello breve de pantalla (dorado o rojo). */
export function screenFlash(kind: 'gold' | 'ember' = 'gold'): void {
  const el = document.getElementById('screen-flash');
  if (!el) return;
  el.classList.toggle('ember', kind === 'ember');
  gsap.killTweensOf(el);
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.06, yoyo: true, repeat: 1 });
}

/** Vibración de la viñeta roja al recibir daño. */
export function damageVignette(): void {
  const el = document.getElementById('damage-vignette');
  if (!el) return;
  el.classList.remove('active');
  void el.offsetWidth; // reinicia la animación CSS
  el.classList.add('active');
}

/** Número de daño que asciende en arco desde un elemento. */
export function floatDamageNumber(from: Element | null, text: string, color = '#f2b441'): void {
  if (!from) return;
  const rect = from.getBoundingClientRect();
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'fixed',
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top + rect.height * 0.3}px`,
    transform: 'translate(-50%, -50%)',
    fontFamily: "'Baloo 2 Variable', system-ui, sans-serif",
    fontWeight: '700',
    fontSize: '28px',
    color,
    textShadow: '0 2px 12px rgba(0,0,0,.6)',
    pointerEvents: 'none',
    zIndex: '95',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  const drift = (Math.random() * 2 - 1) * 40;
  gsap.to(el, {
    y: -70,
    x: drift,
    scale: 1.25,
    duration: 0.55,
    ease: 'power2.out',
  });
  gsap.to(el, {
    opacity: 0,
    duration: 0.3,
    delay: 0.4,
    onComplete: () => el.remove(),
  });
}
