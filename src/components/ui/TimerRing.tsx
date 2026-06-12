interface TimerRingProps {
  secondsLeft: number;
  totalSeconds: number;
}

export function TimerRing({ secondsLeft, totalSeconds }: TimerRingProps) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const ratio = totalSeconds > 0 ? Math.max(0, secondsLeft / totalSeconds) : 0;
  const color = ratio > 0.5 ? 'var(--teal)' : ratio > 0.25 ? 'var(--gold)' : 'var(--ember)';
  return (
    <div className="timer-ring">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 300ms' }}
        />
      </svg>
      <span className="timer-label" style={{ color }}>
        {Math.ceil(secondsLeft)}
      </span>
    </div>
  );
}
