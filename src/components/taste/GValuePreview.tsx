import type { TasteProfile } from '@/types';
import { adjustedAmount, dominantTasteLevel } from '@/utils/tasteMatrix';

interface Props {
  tasteProfile: TasteProfile;
}

const PREVIEW_ITEMS = [
  { id: 'f4', name: '고추장', base: 30, unit: 'g', icon: '🌶️', type: 'seasoning' as const },
  { id: 'f7', name: '설탕',   base: 10, unit: 'g', icon: '🍬', type: 'seasoning' as const },
  { id: 'f6', name: '간장',   base: 15, unit: 'ml', icon: '🫙', type: 'seasoning' as const },
];

export function GValuePreview({ tasteProfile }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-sm font-bold text-gray-700 mb-1">2인분 기준 실시간 계량 미리보기</p>
      <p className="text-xs text-gray-400 mb-4">슬라이더 변경 시 조리 레시피 g 수가 자동 조정됩니다</p>
      <div className="space-y-3">
        {PREVIEW_ITEMS.map(item => {
          const level = dominantTasteLevel(item.name, tasteProfile);
          const adj = adjustedAmount(item.base, item.type, level, 2);
          return (
            <div key={item.id} className="flex items-center gap-3">
              <span className="text-xl w-7 text-center">{item.icon}</span>
              <span className="flex-1 text-sm text-gray-700">{item.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 line-through">{item.base}{item.unit}</span>
                <span className="text-base font-black text-[#FF6B35] transition-all duration-300">
                  {adj}{item.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
