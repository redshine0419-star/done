import type { RecipeStep } from '@/types';

interface Props {
  steps: RecipeStep[];
  currentIndex: number;
  color: string;
}

export function StepProgressBar({ steps, currentIndex, color }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <div className={`flex flex-col items-center gap-0.5`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? `${color} text-white` : active ? `${color} text-white ring-4 ring-orange-200 scale-110` : 'bg-gray-200 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className="text-[9px] text-gray-400 max-w-[36px] text-center leading-none truncate">{step.action}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 shrink-0 ${done ? color.replace('bg-', 'bg-') : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
