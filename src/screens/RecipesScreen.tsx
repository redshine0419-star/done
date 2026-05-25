import { useMemo } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import type { Recipe, FridgeItem } from '@/types';

function getMatchRate(recipe: Recipe, fridgeItems: FridgeItem[]): number {
  const mains = recipe.ingredients.filter(i => i.type === 'main');
  if (mains.length === 0) return 100;
  const have = mains.filter(ing => fridgeItems.some(f => f.ingredient_id === ing.ingredient_id)).length;
  return Math.round((have / mains.length) * 100);
}

export function RecipesScreen() {
  const { state, dispatch } = useApp();
  const { fridgeItems } = state;

  const sorted = useMemo(
    () => [...mockRecipes].sort((a, b) => getMatchRate(b, fridgeItems) - getMatchRate(a, fridgeItems)),
    [fridgeItems]
  );

  const canMakeNow = sorted.filter(r => getMatchRate(r, fridgeItems) >= 80).length;

  function handleStart(recipe: Recipe) {
    dispatch({ type: 'START_COOKING', payload: recipe });
  }

  return (
    <ScreenWrapper
      title="🧊 냉장고 맞춤 레시피"
      subtitle={fridgeItems.length > 0 ? `지금 바로 만들 수 있는 레시피 ${canMakeNow}개` : '재료를 등록하면 맞춤 추천을 해드려요'}
    >
      <div className="space-y-4">

        {fridgeItems.length === 0 ? (
          <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 flex gap-3 items-start">
            <span className="text-2xl shrink-0">💡</span>
            <div>
              <p className="text-sm font-bold text-orange-800">냉장고 재료를 먼저 등록해 보세요</p>
              <p className="text-xs text-orange-600 mt-1">재료를 등록하면 지금 당장 만들 수 있는 레시피를 % 기준으로 추천해 드립니다.</p>
              <button
                onClick={() => dispatch({ type: 'NAVIGATE', payload: 'fridge' })}
                className="mt-2 text-xs font-bold text-orange-700 underline touch-manipulation"
              >
                냉장고 탭으로 이동 →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xl font-black text-green-600">{canMakeNow}</p>
              <p className="text-xs text-green-700 mt-0.5">바로 가능</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xl font-black text-orange-500">{fridgeItems.length}</p>
              <p className="text-xs text-orange-600 mt-0.5">보유 식재료</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xl font-black text-purple-600">{sorted.filter(r => r.isCombo).length}</p>
              <p className="text-xs text-purple-700 mt-0.5">2구 코스</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-sm font-bold text-purple-700">⚡ 2구 병렬 조리란?</p>
          <p className="text-xs text-purple-600 mt-1">두 화구를 동시에 사용해 메인과 국을 함께 완성. 순차 조리 대비 최대 47% 시간 단축!</p>
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {fridgeItems.length > 0 ? '보유 재료 많은 순' : '전체 레시피'}
        </p>

        {sorted.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            fridgeItems={fridgeItems}
            onStart={handleStart}
          />
        ))}
      </div>
    </ScreenWrapper>
  );
}
