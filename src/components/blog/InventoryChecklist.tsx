'use client';
import type { Recipe, FridgeItem, TasteProfile } from '@/types';
import { adjustedAmount, dominantTasteLevel } from '@/utils/tasteMatrix';
import { ingredientMatches } from '@/utils/ingredientMatch';

interface Props {
  recipe: Recipe;
  fridgeItems: FridgeItem[];
  tasteProfile: TasteProfile;
}

export function InventoryChecklist({ recipe, fridgeItems, tasteProfile }: Props) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
      <p className="text-sm font-bold text-gray-700 mb-3">재료 보유 현황</p>
      {recipe.ingredients.map(ing => {
        const fridge = fridgeItems.find(f => ingredientMatches(f, ing));
        const level = dominantTasteLevel(ing.name, tasteProfile);
        const needed = adjustedAmount(ing.base_amount, ing.type, level, recipe.servings);
        const have = fridge?.amount ?? 0;
        const ok = have >= needed;

        return (
          <div key={ing.ingredient_id} className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ok ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {ok ? '✓' : '✗'}
            </span>
            <span className="flex-1 text-sm text-gray-700">{ing.name}</span>
            <span className={`text-xs font-semibold ${ok ? 'text-green-600' : 'text-red-500'}`}>
              필요 {needed}{ing.unit} / 보유 {have}{ing.unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
