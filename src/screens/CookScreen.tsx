import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { WakeLockToggle } from '@/components/cook/WakeLockToggle';
import { BurnerPlayer } from '@/components/cook/BurnerPlayer';
import { GanttTimeline } from '@/components/cook/GanttTimeline';
import { VoiceControlSim } from '@/components/cook/VoiceControlSim';
import { CompletionModal } from '@/components/cook/CompletionModal';
import { useApp } from '@/context/AppContext';
import { useCookTimer } from '@/hooks/useTimer';
import { adjustedAmount, dominantTasteLevel } from '@/utils/tasteMatrix';
import type { AdjustedIngredient, VoiceCommand } from '@/types';

export function CookScreen() {
  const { state, dispatch } = useApp();
  const { activeCookRecipe: recipe, cookSession: cs, tasteProfile } = state;
  const [showComplete, setShowComplete] = useState(false);

  useCookTimer();

  if (cs?.isComplete && !showComplete) setShowComplete(true);

  if (!recipe || !cs) {
    return (
      <ScreenWrapper title="⏱ 쿠킹 모드">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
          <p className="text-5xl">🍽️</p>
          <p className="font-semibold text-gray-600">조리할 레시피를 선택해 주세요</p>
          <p className="text-sm">블로그 또는 코스싱크 탭에서 레시피를 선택하세요</p>
          <button
            onClick={() => dispatch({ type: 'NAVIGATE', payload: 'blog' })}
            className="mt-2 px-6 py-3 rounded-2xl bg-[#FF6B35] text-white font-bold touch-manipulation"
          >
            블로그로 이동
          </button>
        </div>
      </ScreenWrapper>
    );
  }

  const b1Steps = recipe.steps.filter(s => s.burner === 1);
  const b2Steps = recipe.steps.filter(s => s.burner === 2);
  const b1Complete = cs.burner1StepIndex >= b1Steps.length;
  const b2Complete = !recipe.isCombo || cs.burner2StepIndex >= b2Steps.length;

  function handleVoiceCommand(cmd: VoiceCommand) {
    if (cmd === 'next') {
      if (!b1Complete) dispatch({ type: 'ADVANCE_COOK_STEP', payload: { burner: 1 } });
      else if (!b2Complete) dispatch({ type: 'ADVANCE_COOK_STEP', payload: { burner: 2 } });
    } else if (cmd === 'pause') {
      cs!.isRunning ? dispatch({ type: 'PAUSE_COOKING' }) : dispatch({ type: 'RESUME_COOKING' });
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
  }

  return (
    <>
      <ScreenWrapper title={`⏱ ${recipe.title}`} subtitle={recipe.isCombo ? '2구 병렬 조리 중' : '1구 단독 조리 중'} noPad>
        <div className="px-4 pt-4 space-y-4 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <WakeLockToggle />
            <div className="flex gap-2">
              <button
                onClick={() => cs.isRunning ? dispatch({ type: 'PAUSE_COOKING' }) : dispatch({ type: 'RESUME_COOKING' })}
                className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold touch-manipulation"
              >
                {cs.isRunning ? '⏸ 일시정지' : '▶ 재개'}
              </button>
              <button
                onClick={() => { dispatch({ type: 'RESET_COOKING' }); setShowComplete(false); }}
                className="px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-sm font-semibold touch-manipulation"
              >
                ✕ 종료
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
              className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-lg touch-manipulation shadow-md"
            >
              🎉 조리 완료 — 재료 차감하기
            </button>
          )}
        </div>
      </ScreenWrapper>

      {showComplete && (
        <CompletionModal
          adjustedIngredients={buildAdjustedIngredients()}
          onConfirm={handleConfirmDeduction}
          onClose={() => setShowComplete(false)}
        />
      )}
    </>
  );
}
