'use client';
import type { BlogPost } from '@/types';
import { mockRecipes } from '@/data/mockRecipes';

interface Props {
  post: BlogPost | null;
  onClose: () => void;
  onStartCooking: (recipeId: string) => void;
}

// 인라인 볼드(**text**) → React 요소
function InlineText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-bold text-gray-900">{part}</strong>
          : part
      )}
    </>
  );
}

// dangerouslySetInnerHTML 없이 마크다운을 React 요소로 렌더링 (XSS 안전)
function MarkdownBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="text-sm text-gray-700 leading-relaxed space-y-3">
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-black text-gray-900 mt-4 mb-1">
              {block.slice(3)}
            </h2>
          );
        }

        const listItems = block.split('\n').filter(l => l.startsWith('- '));
        if (listItems.length > 0) {
          return (
            <ul key={i} className="space-y-1 pl-4">
              {listItems.map((item, j) => (
                <li key={j} className="list-disc text-sm text-gray-700">
                  <InlineText text={item.slice(2)} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-sm text-gray-700">
            <InlineText text={block} />
          </p>
        );
      })}
    </div>
  );
}

export function MagazinePostDetail({ post, onClose, onStartCooking }: Props) {
  if (!post) return null;

  const relatedRecipe = post.related_recipe_id
    ? mockRecipes.find(r => r.id === post.related_recipe_id)
    : null;

  const date = new Date(post.published_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-3">
            <span className="text-5xl">{post.thumbnail}</span>
            <div className="flex-1">
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {post.category}
              </span>
              <h2 className="font-black text-gray-900 text-lg mt-1 leading-snug">{post.title}</h2>
              <p className="text-xs text-gray-400 mt-1">{post.author} · {date} · {post.readTime}분 읽기</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-gray-600 bg-orange-50 rounded-xl p-3 mb-4 italic">{post.summary}</p>

          <MarkdownBody text={post.body} />

          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map(tag => (
              <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
                #{tag}
              </span>
            ))}
          </div>

          {relatedRecipe && (
            <button
              onClick={() => onStartCooking(relatedRecipe.id)}
              className="w-full mt-6 h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation shadow-md"
            >
              🍳 {relatedRecipe.title} 바로 조리하기 →
            </button>
          )}

          <div className="h-6" />
        </div>

        <div className="px-5 pb-6 pt-2 shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold touch-manipulation"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
