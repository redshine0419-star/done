'use client';
import { TASTE_LABELS } from '@/constants/taste';

interface Props {
  label: string;
  emoji: string;
  value: 1 | 2 | 3;
  onChange: (v: 1 | 2 | 3) => void;
  color: string;
}

export function TasteSlider({ label, emoji, value, onChange, color }: Props) {
  const dots = [1, 2, 3] as const;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="font-bold text-gray-900 text-base">{label}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${color}`}>
          {TASTE_LABELS[value]}
        </span>
      </div>
      <div className="flex gap-3">
        {dots.map(d => (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={`flex-1 h-14 rounded-xl font-bold text-sm transition-all touch-manipulation border-2 ${
              value === d
                ? `${color} border-current scale-105 shadow-md`
                : 'bg-gray-100 text-gray-400 border-transparent'
            }`}
          >
            {TASTE_LABELS[d]}
          </button>
        ))}
      </div>
    </div>
  );
}
