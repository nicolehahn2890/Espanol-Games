import { DIFFICULTIES, type DifficultyChoice } from '@/game/difficulty';
import { sfx } from '@/fx/audio';

interface DifficultyPickerProps {
  value: DifficultyChoice;
  onChange: (value: DifficultyChoice) => void;
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  return (
    <div className="difficulty-row">
      {DIFFICULTIES.map((d) => (
        <button
          key={d.id}
          className={`difficulty-btn ${value === d.id ? 'selected' : ''}`}
          onClick={() => {
            sfx('tap');
            onChange(d.id);
          }}
        >
          <span className="diff-emoji">{d.emoji}</span>
          {d.label}
        </button>
      ))}
    </div>
  );
}
