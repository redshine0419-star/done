import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import type { Recipe } from '@/types';

export function RecipesScreen() {
  const { dispatch } = useApp();

  function handleStart(recipe: Recipe) {
    dispatch({ type: 'START_COOKING', payload: recipe });
  }

  return (
    <ScreenWrapper title="🍳 인기 코스싱크" subtitle="2구 병렬 조리로 시간을 절약하세요">
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-sm font-bold text-purple-700">⚡ 2구 병렬 조리란?</p>
          <p className="text-xs text-purple-600 mt-1">두 화구를 동시에 사용해 메인과 사이드를 함께 완성합니다. 순차 조리 대비 최대 50% 시간 단축!</p>
        </div>

        {mockRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} onStart={handleStart} />
        ))}
      </div>
    </ScreenWrapper>
  );
}
