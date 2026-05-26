'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { TastePanel } from '@/components/recipe/TastePanel';
import { useApp } from '@/context/AppContext';
import { useRecipes } from '@/hooks/useRecipes';
import { getMatchRate } from '@/utils/ingredientMatch';
import type { Recipe } from '@/types';

type Filter = 'all' | 'single' | 'combo';

export default function RecipePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { fridgeItems } = state;
  const allRecipes = useRecipes();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const sorted = useMemo(() => {
    const list = allRecipes
      .filter(r => filter === 'all' || (filter === 'combo' ? r.isCombo : !r.isCombo))
      .filter(r => r.title.includes(query) || r.story.includes(query));
    return fridgeItems.length > 0
      ? [...list].sort((a, b) => getMatchRate(b, fridgeItems) - getMatchRate(a, fridgeItems))
      : list;
  }, [allRecipes, fridgeItems, filter, query]);

  const canMakeNow = allRecipes.filter(r => getMatchRate(r, fridgeItems) >= 80).length;

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

  const addButton = (
    <Link href="/recipe/submit"
          className="w-9 h-9 flex items-center justify-center rounded-xl touch-manipulation"
          style={{ background: 'var(--brand-light)' }}>
      <Plus size={18} color="var(--brand)" strokeWidth={2.5} />
    </Link>
  );

  return (
    <ScreenWrapper title="레시피" subtitle={subtitle} action={addButton}>
      <div className="space-y-4">

        {/* Stats row */}
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
              <p className="text-xl font-black text-purple-600">{allRecipes.filter(r => r.isCombo).length}</p>
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

        {/* Search */}
        <div className="relative">
          <Search size={16} color="var(--text-3)" className="absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="레시피 검색"
            className="w-full h-12 pl-10 pr-4 rounded-2xl text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)' }}
          />
        </div>

        {/* Taste panel */}
        <TastePanel />

        {/* Filter chips */}
        <div className="flex gap-2">
          {filterBtns.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className="px-4 py-2 rounded-full text-sm font-semibold touch-manipulation transition-colors"
              style={{
                background: filter === btn.value ? 'var(--brand)' : 'var(--surface)',
                color: filter === btn.value ? 'white' : 'var(--text-2)',
                border: `1px solid ${filter === btn.value ? 'var(--brand)' : 'var(--border)'}`,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {fridgeItems.length > 0 && (
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            보유 재료 많은 순
          </p>
        )}

        {/* Recipe grid: 1 col mobile, 2 col md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              fridgeItems={fridgeItems}
              onStart={handleStart}
            />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-3)' }}>
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">검색 결과가 없어요</p>
            <button
              onClick={() => { setQuery(''); setFilter('all'); }}
              className="mt-3 text-xs font-semibold"
              style={{ color: 'var(--brand)' }}
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
}
