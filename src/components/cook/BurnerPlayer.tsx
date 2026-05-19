import type { RecipeStep } from '@/types';
import { StepProgressBar } from './StepProgressBar';

interface Props {
  burner: 1 | 2;
  steps: RecipeStep[];
  currentStepIndex: number;
  elapsed: number;
  onNext: () => void;
  isComplete: boolean;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function BurnerPlayer({ burner, steps, currentStepIndex, elapsed, onNext, isComplete }: Props) {
  const isB1 = burner === 1;
  const accent = isB1 ? 'bg-[#FF6B35]' : 'bg-blue-500';
  const accentText = isB1 ? 'text-[#FF6B35]' : 'text-blue-500';
  const burnerLabel = isB1 ? '🔥 1구 화구' : '💧 2구 화구';

  const currentStep = steps[currentStepIndex];
  const remaining = currentStep ? currentStep.duration_sec - elapsed : 0;
  const progress = currentStep ? (elapsed / currentStep.duration_sec) * 100 : 100;

  return (
    <div className={`rounded-2xl border-2 ${isB1 ? 'border-orange-200' : 'border-blue-200'} bg-white overflow-hidden`}>
      <div className={`${accent} px-4 py-2 flex items-center justify-between`}>
        <span className="text-white font-bold text-sm">{burnerLabel}</span>
        {isComplete && <span className="text-white text-xs font-bold">✓ 완성!</span>}
      </div>

      <div className="px-4 pt-3 pb-1 overflow-x-auto">
        <StepProgressBar steps={steps} currentIndex={currentStepIndex} color={accent} />
      </div>

      {isComplete ? (
        <div className="px-4 py-6 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-bold text-gray-700">조리 완료!</p>
        </div>
      ) : currentStep ? (
        <div className="px-4 pb-4 pt-2 space-y-3">
          <div>
            <p className={`text-xl font-black ${accentText}`}>{currentStep.action}</p>
            <p className="text-sm text-gray-500 mt-1">{currentStep.description}</p>
          </div>

          {/* Timer ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={isB1 ? '#FF6B35' : '#3b82f6'}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-base font-black ${accentText}`}>{formatTime(remaining)}</span>
              </div>
            </div>
            <button
              onClick={onNext}
              className={`flex-1 h-14 rounded-2xl ${accent} text-white font-bold text-base touch-manipulation`}
            >
              다음 단계 →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
