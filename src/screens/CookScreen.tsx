'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { WakeLockToggle } from '@/components/cook/WakeLockToggle';
import { BurnerPlayer } from '@/components/cook/BurnerPlayer';
import { GanttTimeline } from '@/components/cook/GanttTimeline';
import { VoiceControlSim } from '@/components/cook/VoiceControlSim';
import { CompletionModal } from '@/components/cook/CompletionModal';
import { Pause, Play, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useCookTimer } from '@/hooks/useTimer';
import { adjustedAmount, dominantTasteLevel } from '@/utils/tasteMatrix';
import type { AdjustedIngredient, VoiceCommand } from '@/types';

export function CookScreen() {
  const { state, dispatch } = useApp();
  const { activeCookRecipe: recipe, cookSession: cs, tasteProfile } = state;
  const [showComplete, setShowComplete] = useState(false);
  const router = useRouter();

  useCookTimer();

  useEffect(() => {
    if (cs?.isComplete) setShowComplete(true);
  }, [cs?.isComplete]);

  if (!recipe || !cs) {
    return (
      <ScreenWrapper title="조리 모드">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
               style={{ background: 'var(--brand-light)' }}>
            🍽️
          </div>
          <div className="text-center">
            <p className="font-bold text-[16px]" style={{ color: 'var(--text-1)' }}>
              조리할 레시피를 선택해 주세요
            </p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-3)' }}>
              레시피 탭에서 레시피를 선택하세요
            </p>
          </div>
          <button
            onClick={() => router.push('/recipe')}
            className="px-6 py-3 rounded-2xl font-bold text-[14px] touch-manipulation"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            레시피 보러 가기
          </button>
        </div>
      </ScreenWrapper>
    );
  }

  const isDessert = recipe.steps.every(s => s.burner === null);
  const b1Steps = isDessert ? recipe.steps : recipe.steps.filter(s => s.burner === 1);
  const b2Steps = recipe.steps.filter(s => s.burner === 2);
  const b1Complete = cs.burner1StepIndex >= b1Steps.length;
  const b2Complete = !recipe.isCombo || cs.burner2StepIndex >= b2Steps.length;

  function handleVoiceCommand(cmd: VoiceCommand) {
    if (cmd === 'next') {
      if (!b1Complete) dispatch({ type: 'ADVANCE_COOK_STEP', payload: { burner: 1 } });
      else if (!b2Complete) dispatch({ type: 'ADVANCE_COOK_STEP', payload: { burner: 2 } });
    } else if (cmd === 'pause') {
      if (cs!.isRunning) dispatch({ type: 'PAUSE_COOKING' });
      else dispatch({ type: 'RESUME_COOKING' });
    } else if (cmd === 'complete') {
      setShowComplete(true);
    }
  }

  function buildAdjustedIngredients(): AdjustedIngredient[] {
    if (!recipe) return [];
    return recipe.ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id,
      name: ing.name,
      adjustedAmount: adjustedAmount(
        ing.base_amount,
        ing.type,
        dominantTasteLevel(ing.name, tasteProfile),
        recipe.servings,
      ),
      unit: ing.unit,
    }));
  }

  function handleConfirmDeduction() {
    dispatch({ type: 'DEDUCT_INGREDIENTS', payload: buildAdjustedIngredients() });
    dispatch({ type: 'RESET_COOKING' });
    setShowComplete(false);
    router.push('/recipe');
  }

  return (
    <>
      <ScreenWrapper title={recipe.title} subtitle={recipe.isCombo ? '2구 병렬 조리 중' : '1구 단독 조리 중'} noPad>
        <div className="px-4 pt-4 space-y-4 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <WakeLockToggle />
            <div className="flex gap-2">
              <button
                onClick={() => cs.isRunning ? dispatch({ type: 'PAUSE_COOKING' }) : dispatch({ type: 'RESUME_COOKING' })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold touch-manipulation"
                style={{ background: 'var(--bg)', color: 'var(--text-2)' }}
              >
                {cs.isRunning
                  ? <><Pause size={13} strokeWidth={2} /> 일시정지</>
                  : <><Play size={13} strokeWidth={2} /> 재개</>
                }
              </button>
              <button
                onClick={() => { dispatch({ type: 'RESET_COOKING' }); setShowComplete(false); router.push('/recipe'); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold touch-manipulation"
                style={{ background: 'var(--bg)', color: 'var(--text-3)' }}
              >
                <X size={13} strokeWidth={2} /> 종료
              </button>
            </div>
          </div>

          <BurnerPlayer
            burner={1}
            steps={b1Steps}
            currentStepIndex={cs.burner1StepIndex}
            stepStartMs={cs.burner1StepStartMs}
            pausedDuration={cs.pausedDuration}
            isRunning={cs.isRunning}
            onNext={() => dispatch({ type: 'ADVANCE_COOK_STEP', payload: { burner: 1 } })}
            isComplete={b1Complete}
          />

          {recipe.isCombo && (
            <BurnerPlayer
              burner={2}
              steps={b2Steps}
              currentStepIndex={cs.burner2StepIndex}
              stepStartMs={cs.burner2StepStartMs}
              pausedDuration={cs.pausedDuration}
              isRunning={cs.isRunning}
              onNext={() => dispatch({ type: 'ADVANCE_COOK_STEP', payload: { burner: 2 } })}
              isComplete={b2Complete}
            />
          )}

          <GanttTimeline
            recipe={recipe}
            b1StepIndex={cs.burner1StepIndex}
            b2StepIndex={cs.burner2StepIndex}
          />

          <VoiceControlSim onCommand={handleVoiceCommand} />

          {b1Complete && b2Complete && (
            <button
              onClick={() => setShowComplete(true)}
              className="w-full h-[54px] rounded-2xl font-bold text-[15px] touch-manipulation"
              style={{ background: 'var(--green)', color: 'white', boxShadow: '0 2px 12px rgba(43,122,79,0.3)' }}
            >
              조리 완료 — 재료 차감하기
            </button>
          )}
        </div>
      </ScreenWrapper>

      {showComplete && (
        <CompletionModal
          recipeName={recipe.title}
          adjustedIngredients={buildAdjustedIngredients()}
          onConfirm={handleConfirmDeduction}
          onClose={() => setShowComplete(false)}
        />
      )}
    </>
  );
}
