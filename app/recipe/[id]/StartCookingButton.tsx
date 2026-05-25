'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';

export function StartCookingButton({ recipeId, isCombo }: { recipeId: string; isCombo: boolean }) {
  const { dispatch } = useApp();
  const router = useRouter();

  function handleStart() {
    const recipe = mockRecipes.find(r => r.id === recipeId);
    if (recipe) {
      dispatch({ type: 'START_COOKING', payload: recipe });
      router.push('/cook');
    }
  }

  return (
    <button
      onClick={handleStart}
      className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation shadow-md"
    >
      {isCombo ? '🍳 2구 코스 조리 시작' : '🔥 조리 시작'}
    </button>
  );
}
