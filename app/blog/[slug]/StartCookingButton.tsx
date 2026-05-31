'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import { mockRecipesEn } from '@/data/mockRecipesEn';
import { t, isEn } from '@/i18n';

export function StartCookingButton({ recipeId }: { recipeId: string }) {
  const { dispatch } = useApp();
  const router = useRouter();

  function handleStart() {
    const base = isEn ? mockRecipesEn : mockRecipes;
    const recipe = base.find(r => r.id === recipeId);
    if (recipe) {
      dispatch({ type: 'START_COOKING', payload: recipe });
      router.push('/cook');
    }
  }

  return (
    <button
      onClick={handleStart}
      className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation"
    >
      {t.blog.startCooking}
    </button>
  );
}
