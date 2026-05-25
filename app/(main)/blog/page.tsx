'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { CategoryFilterChips } from '@/components/magazine/CategoryFilterChips';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import type { BlogCategory, BlogPost } from '@/types';

import type { Metadata } from 'next';

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.id}`} className="block">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0">{post.thumbnail}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                {post.category}
              </span>
              <span className="text-xs text-gray-400">{post.readTime}분 읽기</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{post.title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.summary}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">{post.author}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{post.published_at}</span>
            </div>
          </div>
        </div>
        {post.related_recipe_id && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-orange-500 font-semibold">🍳 관련 레시피 있음</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function BlogListPage() {
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [query, setQuery] = useState('');
  const { posts, loading, error } = useBlogPosts(category, query);

  return (
    <ScreenWrapper title="📝 블로그" subtitle="레시피·식재료·요리 과학 이야기">
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
          <BlogCard key={post.id} post={post} />
        ))}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">검색 결과가 없어요</p>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
}
