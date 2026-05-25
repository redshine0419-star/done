'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import type { Recipe, FridgeItem } from '@/types';

type Filter = 'all' | 'single' | 'combo';

function getMatchRate(recipe: Recipe, fridgeItems: FridgeItem[]): number {
  const mains = recipe.ingredients.filter(i => i.type === 'main');
  if (mains.length === 0) return 100;
  const have = mains.filter(ing =>
    fridgeItems.some(f => f.ingredient_id === ing.ingredient_id)
  ).length;
  return Math.round((have / mains.length) * 100);
}

export default function RecipePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { fridgeItems } = state;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const sorted = useMemo(() => {
    const list = mockRecipes
      .filter(r => filter === 'all' || (filter === 'combo' ? r.isCombo : !r.isCombo))
      .filter(r => r.title.includes(query) || r.story.includes(query));
    return fridgeItems.length > 0
      ? [...list].sort((a, b) => getMatchRate(b, fridgeItems) - getMatchRate(a, fridgeItems))
      : list;
  }, [fridgeItems, filter, query]);

  const canMakeNow = mockRecipes.filter(r => getMatchRate(r, fridgeItems) >= 80).length;

  function handleStart(recipe: Recipe) {
    dispatch({ type: 'START_COOKING', payload: recipe });
    router.push('/cook');
  }

  const filterBtns: { value: Filter; label: string }[] = [
    { value: 'all',    label: '전체' },
    { value: 'single', label: '1구 단품' },
    { value: 'combo',  label: '2구 코스 ⚡' },
  ];

  const subtitle = fridgeItems.length > 0
    ? `지금 바로 만들 수 있는 레시피 ${canMakeNow}개`
    : '냉장고 재료를 등록하면 맞춤 추천해 드려요';

  return (
    <ScreenWrapper title="🍳 레시피" subtitle={subtitle}>
      <div className="space-y-4">

        {fridgeItems.length > 0 && (
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
              <p className="text-xl font-black text-purple-600">{mockRecipes.filter(r => r.isCombo).length}</p>
              <p className="text-xs text-purple-700 mt-0.5">2구 코스</p>
            </div>
          </div>
        )}

        {fridgeItems.length === 0 && (
          <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 flex gap-3 items-start">
            <span className="text-2xl shrink-0">💡</span>
            <div>
              <p className="text-sm font-bold text-orange-800">냉장고 재료를 먼저 등록해 보세요</p>
              <p className="text-xs text-orange-600 mt-1">재료를 등록하면 지금 당장 만들 수 있는 레시피를 % 기준으로 추천해 드립니다.</p>
              <button
                onClick={() => router.push('/fridge')}
                className="mt-2 text-xs font-bold text-orange-700 underline touch-manipulation"
              >
                냉장고 탭으로 이동 →
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="레시피 검색"
            className="w-full h-12 pl-10 pr-4 rounded-2xl border border-gray-200 bg-white text-sm"
          />
        </div>

        <div className="flex gap-2">
          {filterBtns.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold touch-manipulation transition-colors ${
                filter === btn.value ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {fridgeItems.length > 0 && (
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            보유 재료 많은 순
          </p>
        )}

        {sorted.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            fridgeItems={fridgeItems}
            onStart={handleStart}
          />
        ))}

        {sorted.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">검색 결과가 없어요</p>
            <button
              onClick={() => { setQuery(''); setFilter('all'); }}
              className="mt-3 text-xs text-[#FF6B35] font-semibold"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
}
