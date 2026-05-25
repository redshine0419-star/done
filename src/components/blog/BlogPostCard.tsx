'use client';
import { useState } from 'react';
import type { Recipe, FridgeItem, TasteProfile } from '@/types';
import { InventoryChecklist } from './InventoryChecklist';

interface Props {
  recipe: Recipe;
  fridgeItems: FridgeItem[];
  tasteProfile: TasteProfile;
  onStart: (recipe: Recipe) => void;
}

export function BlogPostCard({ recipe, fridgeItems, tasteProfile, onStart }: Props) {
  const [expanded, setExpanded] = useState(false);
  const totalSec = recipe.steps.filter(s => s.burner === 1 || !recipe.isCombo).reduce((a, s) => a + s.duration_sec, 0);
  const mins = Math.round(totalSec / 60);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="relative bg-gradient-to-br from-orange-100 to-amber-50 p-6 flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="text-6xl">{recipe.thumbnail}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {recipe.isCombo && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">2구 코스</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">~{mins}분</span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg">{recipe.title}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{recipe.story}</p>
        </div>
        <span className={`text-gray-400 text-xl transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          <InventoryChecklist recipe={recipe} fridgeItems={fridgeItems} tasteProfile={tasteProfile} />
          <button
            onClick={() => onStart(recipe)}
            className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation shadow-md"
          >
            {recipe.isCombo ? '🍳 2구 코스 조리 시작' : '🔥 1구 단독 조리 시작'}
          </button>
        </div>
      )}
    </div>
  );
}
