interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Iconos SVG propios, de trazo limpio y redondeado, que usan currentColor.
 * Sustituyen a los emojis para un aspecto más moderno y coherente.
 */

export function IconPalabra({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2.5" y="6.5" width="6" height="6" rx="1.6" fill="currentColor" />
      <rect x="9.5" y="6.5" width="6" height="6" rx="1.6" fill="currentColor" opacity="0.55" />
      <rect x="16.5" y="6.5" width="5" height="6" rx="1.6" fill="currentColor" opacity="0.3" />
      <rect x="5.5" y="15" width="13" height="2.6" rx="1.3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function IconQuiz({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M5 3.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.5 3.6A.6.6 0 0 1 3.5 19.6V5.5a2 2 0 0 1 2-2Z"
        fill="currentColor"
      />
      <path
        d="M9.6 9.2a2.4 2.4 0 0 1 4.7.6c0 1.6-2.3 1.9-2.3 3.2"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <circle cx="12" cy="15.4" r="1.15" fill="#fff" />
    </svg>
  );
}

export function IconParejas({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect x="3" y="5" width="11" height="14" rx="2.4" fill="currentColor" opacity="0.5" />
      <rect x="9.5" y="3.5" width="11.5" height="15" rx="2.4" fill="currentColor" />
      <path
        d="M12.5 11.2l2 2 3.4-3.6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconGrupos({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" />
    </svg>
  );
}

export function IconTrofeo({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" fill="currentColor" />
      <path
        d="M17 5h2.5a.5.5 0 0 1 .5.5C20 8 18.5 9.5 16.5 9.5M7 5H4.5a.5.5 0 0 0-.5.5C4 8 5.5 9.5 7.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="10.7" y="11.5" width="2.6" height="4" fill="currentColor" />
      <rect x="7.5" y="18.5" width="9" height="2.4" rx="1.2" fill="currentColor" />
      <rect x="9.3" y="15.3" width="5.4" height="2.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

export function IconCandado({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.6" fill="currentColor" />
      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="15.2" r="1.5" fill="#fff" />
    </svg>
  );
}

export function IconGrafico({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect x="3.5" y="13" width="4.3" height="7.5" rx="1.6" fill="currentColor" opacity="0.55" />
      <rect x="9.85" y="8.5" width="4.3" height="12" rx="1.6" fill="currentColor" />
      <rect x="16.2" y="4" width="4.3" height="16.5" rx="1.6" fill="currentColor" opacity="0.78" />
    </svg>
  );
}

/** Logo: burbuja de diálogo brillante con la Ñ (símbolo del español). */
export function LogoBubble({ size = 120, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} fill="none">
      <defs>
        <linearGradient id="bubbleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a7bff" />
          <stop offset="55%" stopColor="#7a3ff0" />
          <stop offset="100%" stopColor="#6128c8" />
        </linearGradient>
      </defs>
      {/* cola */}
      <path d="M34 86 L26 108 L52 90 Z" fill="#6128c8" />
      {/* cuerpo de la burbuja */}
      <rect
        x="10"
        y="12"
        width="100"
        height="82"
        rx="26"
        fill="url(#bubbleGrad)"
        stroke="#4d1ba6"
        strokeWidth="3"
      />
      {/* brillo superior */}
      <ellipse cx="48" cy="32" rx="30" ry="11" fill="#fff" opacity="0.28" />
      {/* la Ñ */}
      <text
        x="60"
        y="74"
        textAnchor="middle"
        fontFamily="'Fredoka Variable', system-ui, sans-serif"
        fontSize="62"
        fontWeight="700"
        fill="#fff"
      >
        ñ
      </text>
    </svg>
  );
}

export function IconLlama({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 2.5c3.2 3.8 5.6 6 5.6 10.2A5.6 5.6 0 0 1 6.4 12.7c0-2 1-3.4 1.8-4.2.2 1.3 1 2 1.8 2 .9 0 1.4-.7 1.4-1.8 0-2 .2-4 .6-6.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
