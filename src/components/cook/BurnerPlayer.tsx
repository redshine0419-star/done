'use client';
import { ChevronRight } from 'lucide-react';
import type { RecipeStep } from '@/types';
import { StepProgressBar } from './StepProgressBar';

interface Props {
  burner: 1 | 2;
  steps: RecipeStep[];
  currentStepIndex: number;
  stepStartMs: number;
  pausedDuration: number;
  isRunning: boolean;
  onNext: () => void;
  isComplete: boolean;
}

function formatTime(sec: number) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export function BurnerPlayer({ burner, steps, currentStepIndex, stepStartMs, pausedDuration, isRunning, onNext, isComplete }: Props) {
  const isB1 = burner === 1;
  const accentColor = isB1 ? 'var(--brand)' : '#2563EB';
  const accentBg   = isB1 ? 'var(--brand-light)' : '#EBF2FF';
  const label      = isB1 ? '1구 화구' : '2구 화구';

  const currentStep = steps[currentStepIndex];
  const elapsed = isRunning
    ? Math.floor((performance.now() - stepStartMs - pausedDuration) / 1000)
    : 0;
  const remaining = currentStep ? Math.max(0, currentStep.duration_sec - elapsed) : 0;
  const progress = currentStep ? Math.min(100, (elapsed / currentStep.duration_sec) * 100) : 100;

  return (
    <div className="rounded-2xl overflow-hidden bg-surface" style={{ border: `1.5px solid ${isB1 ? 'rgba(201,75,42,0.2)' : 'rgba(37,99,235,0.2)'}` }}>
      {/* Header strip */}
      <div className="px-4 py-2.5 flex items-center justify-between"
           style={{ background: accentBg }}>
        <span className="text-[13px] font-bold" style={{ color: accentColor }}>{label}</span>
        {isComplete && (
          <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ background: accentColor }}>
            완성
          </span>
        )}
      </div>

      {/* Step progress */}
      <div className="px-4 pt-3 pb-1 overflow-x-auto">
        <StepProgressBar steps={steps} currentIndex={currentStepIndex}
                         color={isB1 ? 'bg-[var(--brand)]' : 'bg-blue-600'} />
      </div>

      {isComplete ? (
        <div className="px-4 py-6 text-center">
          <p className="font-bold text-[15px]" style={{ color: 'var(--text-2)' }}>조리 완료!</p>
        </div>
      ) : currentStep ? (
        <div className="px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-[18px] font-black" style={{ color: accentColor }}>{currentStep.action}</p>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>
              {currentStep.description}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80"
                   role="progressbar" aria-valuenow={elapsed} aria-valuemax={currentStep.duration_sec}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={accentColor}
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[15px] font-black" style={{ color: accentColor }}>
                  {formatTime(remaining)}
                </span>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={onNext}
              className="flex-1 h-14 rounded-2xl font-bold text-[14px] touch-manipulation flex items-center justify-center gap-2"
              style={{ background: accentColor, color: 'white' }}
            >
              다음 단계
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
