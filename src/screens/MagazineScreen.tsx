import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { CategoryFilterChips } from '@/components/magazine/CategoryFilterChips';
import { MagazinePostCard } from '@/components/magazine/MagazinePostCard';
import { MagazinePostDetail } from '@/components/magazine/MagazinePostDetail';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useApp } from '@/context/AppContext';
import { mockRecipes } from '@/data/mockRecipes';
import type { BlogPost, BlogCategory } from '@/types';

export function MagazineScreen() {
  const { dispatch } = useApp();
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [query, setQuery] = useState('');
  const [openPost, setOpenPost] = useState<BlogPost | null>(null);

  const { posts, loading, error } = useBlogPosts(category, query);

  function handleStartCooking(recipeId: string) {
    const recipe = mockRecipes.find(r => r.id === recipeId);
    if (recipe) {
      setOpenPost(null);
      dispatch({ type: 'START_COOKING', payload: recipe });
    }
  }

  return (
    <>
      <ScreenWrapper title="📰 매거진" subtitle="플레이버 싱크 푸드 매거진">
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="아티클 검색 (재료, 요리팁...)"
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-gray-200 bg-white text-sm"
            />
          </div>

          <CategoryFilterChips selected={category} onChange={setCategory} />

          {loading && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">⏳</p>
              <p className="text-sm">아티클 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          )}

          {!loading && !error && posts.map(post => (
            <MagazinePostCard key={post.id} post={post} onOpen={setOpenPost} />
          ))}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">검색 결과가 없어요</p>
            </div>
          )}
        </div>
      </ScreenWrapper>

      <MagazinePostDetail
        post={openPost}
        onClose={() => setOpenPost(null)}
        onStartCooking={handleStartCooking}
      />
    </>
  );
}
