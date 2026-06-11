'use client';
import type { AdjustedIngredient } from '@/types';
import { t, isEn } from '@/i18n';

interface Props {
  recipeName: string;
  adjustedIngredients: AdjustedIngredient[];
  onConfirm: () => void;
  onClose: () => void;
}

function shareRecipe(recipeName: string) {
  const siteUrl = isEn ? 'https://en.flavorsync.me' : 'https://flavorsync.me';
  const text = isEn
    ? `Just cooked "${recipeName}" with FlavorSync! 🍳\nMade from fridge ingredients → ${siteUrl}/recipe`
    : `플레이버 싱크로 "${recipeName}" 완성! 🍳\n냉장고 재료로 오늘 저녁 해결 → ${siteUrl}/recipe`;
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => alert(t.cook.shareCopied)).catch(() => {});
  }
}

export function CompletionModal({ recipeName, adjustedIngredients, onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 space-y-4 shadow-2xl"
           style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 16px))' }}>
        <div className="text-center">
          <p className="text-5xl mb-2">🎉</p>
          <h2 className="text-xl font-black text-gray-900">{t.cook.completionTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">{recipeName}</p>
        </div>

        {/* Share button */}
        <button
          onClick={() => shareRecipe(recipeName)}
          className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-bold touch-manipulation"
          style={{ background: '#FEF0E8', color: 'var(--brand)', border: '1px solid rgba(201,75,42,0.2)' }}
        >
          {t.cook.shareBtn}
        </button>

        <div>
          <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-3)' }}>{t.cook.ingredientDeduction}</p>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
            {adjustedIngredients.map(ing => (
              <div key={ing.ingredient_id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{ing.name}</span>
                <span className="font-bold text-red-500">-{ing.adjustedAmount} {ing.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-base touch-manipulation"
          >
            {t.cook.later}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation shadow-md"
          >
            {t.cook.confirmDeduct}
          </button>
        </div>
      </div>
    </div>
  );
}
