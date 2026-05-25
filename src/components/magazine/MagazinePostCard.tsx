'use client';
import type { BlogPost } from '@/types';

interface Props {
  post: BlogPost;
  onOpen: (post: BlogPost) => void;
}

export function MagazinePostCard({ post, onOpen }: Props) {
  const date = new Date(post.published_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  return (
    <button
      onClick={() => onOpen(post)}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 touch-manipulation active:scale-[0.99] transition-transform"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-4xl shrink-0">
        {post.thumbnail}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold shrink-0">
            {post.category}
          </span>
          {post.related_recipe_id && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium shrink-0">
              🍳 레시피 연결
            </span>
          )}
        </div>
        <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{post.title}</p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.summary}</p>
        <p className="text-[10px] text-gray-400 mt-2">
          {post.author} · {date} · {post.readTime}분 읽기
        </p>
      </div>
    </button>
  );
}
