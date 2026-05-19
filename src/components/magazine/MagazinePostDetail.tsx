import type { BlogPost } from '@/types';
import { mockRecipes } from '@/data/mockRecipes';

interface Props {
  post: BlogPost | null;
  onClose: () => void;
  onStartCooking: (recipeId: string) => void;
}

// 최소 마크다운 렌더러 (외부 라이브러리 없음)
function renderMarkdown(text: string): string {
  return text
    .replace(/## (.+)/g, '<h2 class="text-base font-black text-gray-900 mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
    .replace(/\| (.+) \|/g, (_, row) => {
      const cells = row.split(' | ').map((c: string) => `<td class="px-2 py-1 border border-gray-200 text-xs">${c}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>)/gs, '<table class="w-full border-collapse my-2 text-left">$1</table>')
    .replace(/^- (.+)/gm, '<li class="ml-4 list-disc text-sm text-gray-700">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-sm text-gray-700 mb-3">');
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

        {/* 헤더 */}
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

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-gray-600 bg-orange-50 rounded-xl p-3 mb-4 italic">{post.summary}</p>

          <div
            className="text-sm text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-gray-700 mb-3">${renderMarkdown(post.body)}</p>` }}
          />

          {/* 태그 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map(tag => (
              <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
                #{tag}
              </span>
            ))}
          </div>

          {/* 관련 레시피 CTA */}
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

        {/* 닫기 */}
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
