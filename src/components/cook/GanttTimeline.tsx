'use client';
import type { Recipe } from '@/types';

interface Props {
  recipe: Recipe;
  b1StepIndex: number;
  b2StepIndex: number;
}

function getTimings(recipe: Recipe, burner: 1 | 2) {
  let elapsed = 0;
  return recipe.steps
    .filter(s => s.burner === burner)
    .map(s => {
      const start = elapsed;
      elapsed += s.duration_sec;
      return { ...s, start, end: elapsed };
    });
}

export function GanttTimeline({ recipe, b1StepIndex, b2StepIndex }: Props) {
  const b1 = getTimings(recipe, 1);
  const b2 = getTimings(recipe, 2);
  const total = Math.max(
    b1.length ? b1[b1.length - 1].end : 0,
    b2.length ? b2[b2.length - 1].end : 0,
  );
  if (total === 0) return null;

  function renderRow(steps: ReturnType<typeof getTimings>, currentIdx: number, color: string, label: string) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-8 shrink-0">{label}</span>
        <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
          {steps.map((s, i) => {
            const left = (s.start / total) * 100;
            const width = ((s.end - s.start) / total) * 100;
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div
                key={i}
                style={{ left: `${left}%`, width: `${width}%` }}
                className={`absolute top-0 bottom-0 flex items-center justify-center text-[8px] font-bold transition-all ${
                  done ? `${color} opacity-60` : active ? `${color} opacity-100` : 'bg-gray-300'
                }`}
                title={s.action}
              >
                {width > 8 && <span className="text-white truncate px-1">{s.action}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <p className="text-xs font-bold text-gray-600 mb-3">간트 차트 (조리 타임라인)</p>
      <div className="space-y-2">
        {renderRow(b1, b1StepIndex, 'bg-[#FF6B35]', '1구')}
        {b2.length > 0 && renderRow(b2, b2StepIndex, 'bg-blue-500', '2구')}
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 mt-1.5 px-10">
        <span>0분</span>
        <span>{Math.round(total / 60 / 2)}분</span>
        <span>{Math.round(total / 60)}분</span>
      </div>
    </div>
  );
}
