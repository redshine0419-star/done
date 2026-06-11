'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { CategoryFilterChips } from '@/components/magazine/CategoryFilterChips';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { t, isEn } from '@/i18n';
import type { BlogCategory, BlogPost } from '@/types';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

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
              <span className="text-xs text-gray-400">
                {isEn ? `${post.readTime} ${t.blog.readTime}` : `${post.readTime}${t.blog.readTime}`}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{post.title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.summary}</p>
            <div className="mt-2">
              <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
            </div>
          </div>
        </div>
        {post.related_recipe_id && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-orange-500 font-semibold">{t.blog.relatedRecipe}</span>
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
    <ScreenWrapper title={t.blog.title} subtitle={t.blog.subtitle}>
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.blog.searchPlaceholder}
            className="w-full h-12 pl-10 pr-4 rounded-2xl border border-gray-200 bg-white text-sm"
          />
        </div>

        <CategoryFilterChips selected={category} onChange={setCategory} />

        {loading && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">⏳</p>
            <p className="text-sm">{t.blog.loadingPosts}</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {t.blog.loadError}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">{t.blog.noResults}</p>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
}
