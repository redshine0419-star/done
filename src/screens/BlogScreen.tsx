import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import type { Recipe } from '@/types';

export function BlogScreen() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState('');

  const singleBurner = mockRecipes.filter(r => !r.isCombo);
  const filtered = singleBurner.filter(r => r.title.includes(query) || r.story.includes(query));

  function handleStart(recipe: Recipe) {
    dispatch({ type: 'START_COOKING', payload: recipe });
  }

  return (
    <ScreenWrapper title="📝 감성 블로그" subtitle="오늘의 홈메이드 레시피">
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="레시피 검색"
            className="w-full h-12 pl-10 pr-4 rounded-2xl border border-gray-200 bg-white text-sm"
          />
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
            <p className="text-sm">검색 결과가 없어요</p>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
}
