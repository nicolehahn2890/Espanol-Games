interface BarProps {
  value: number;
  max: number;
  color: 'gold' | 'teal' | 'ember';
}

export function Bar({ value, max, color }: BarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="bar">
      <div className={`bar-fill ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
