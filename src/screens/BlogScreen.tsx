'use client';
import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import { mockRecipesEn } from '@/data/mockRecipesEn';
import { t, isEn } from '@/i18n';
import type { Recipe } from '@/types';

type Filter = 'all' | 'single' | 'combo';

export function BlogScreen() {
  const { state, dispatch } = useApp();
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const recipes = isEn ? mockRecipesEn : mockRecipes;

  const filtered = recipes
    .filter(r => filter === 'all' || (filter === 'combo' ? r.isCombo : !r.isCombo))
    .filter(r => r.title.includes(query) || r.story.includes(query));

  function handleStart(recipe: Recipe) {
    dispatch({ type: 'START_COOKING', payload: recipe });
  }

  const filterBtns: { value: Filter; label: string }[] = [
    { value: 'all',    label: t.blog.filterAll },
    { value: 'single', label: t.blog.filterSingle },
    { value: 'combo',  label: t.blog.filterCombo },
  ];

  return (
    <ScreenWrapper title={t.blog.screenTitle} subtitle={t.blog.screenSubtitle}>
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.recipe.searchPlaceholder}
            className="w-full h-12 pl-10 pr-4 rounded-2xl border border-gray-200 bg-white text-sm"
          />
        </div>

        <div className="flex gap-2">
          {filterBtns.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold touch-manipulation transition-colors ${
                filter === btn.value
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {filtered.map(recipe => (
          <BlogPostCard
            key={recipe.id}
            recipe={recipe}
            fridgeItems={state.fridgeItems}
            tasteProfile={state.tasteProfile}
            onStart={handleStart}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">{t.blog.noResults}</p>
            <button
              onClick={() => { setQuery(''); setFilter('all'); }}
              className="mt-3 text-xs text-[#FF6B35] font-semibold"
            >
              {t.recipe.resetFilter}
            </button>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
}
