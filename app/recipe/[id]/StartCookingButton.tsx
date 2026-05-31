'use client';
import { useRouter } from 'next/navigation';
import { Flame, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import { mockRecipesEn } from '@/data/mockRecipesEn';
import { t, isEn } from '@/i18n';

export function StartCookingButton({ recipeId, isCombo }: { recipeId: string; isCombo: boolean }) {
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
      className="w-full h-[56px] rounded-2xl font-bold text-[16px] touch-manipulation flex items-center justify-center gap-2"
      style={{ background: 'var(--brand)', color: 'white', boxShadow: '0 4px 16px rgba(201,75,42,0.35)' }}
    >
      {isCombo ? <Zap size={18} strokeWidth={2.5} /> : <Flame size={18} strokeWidth={2} />}
      {isCombo ? `${t.recipe.comboLabel} — ${t.recipe.cookNow}` : t.recipe.cookNow}
    </button>
  );
}
