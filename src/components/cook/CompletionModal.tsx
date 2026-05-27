'use client';
import type { AdjustedIngredient } from '@/types';

interface Props {
  adjustedIngredients: AdjustedIngredient[];
  onConfirm: () => void;
  onClose: () => void;
}

export function CompletionModal({ adjustedIngredients, onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 space-y-4 shadow-2xl"
           style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 16px))' }}>
        <div className="text-center">
          <p className="text-5xl mb-2">🎉</p>
          <h2 className="text-xl font-black text-gray-900">조리 완료!</h2>
          <p className="text-sm text-gray-500 mt-1">사용된 재료를 냉장고에서 차감할까요?</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
          {adjustedIngredients.map(ing => (
            <div key={ing.ingredient_id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{ing.name}</span>
              <span className="font-bold text-red-500">-{ing.adjustedAmount} {ing.unit}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-base touch-manipulation"
          >
            나중에
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation shadow-md"
          >
            차감 확인
          </button>
        </div>
      </div>
    </div>
  );
}
