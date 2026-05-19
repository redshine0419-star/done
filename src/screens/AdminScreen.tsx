import { useState } from 'react';
import { mockRecipes } from '@/data/mockRecipes';
import type { BlogPost, Recipe } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

export function AdminScreen() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<(BlogPost & { db_id?: string })[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function handleGenerate(recipe: Recipe) {
    if (!SUPABASE_URL || !ADMIN_SECRET) {
      setMessage('⚠️ VITE_SUPABASE_URL 또는 VITE_ADMIN_SECRET 환경변수가 없습니다.');
      return;
    }
    setGenerating(recipe.id);
    setMessage('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-blog-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET,
        },
        body: JSON.stringify({ recipe }),
      });
      const data = await res.json();
      if (data.post) {
        const post: BlogPost & { db_id: string } = {
          id: data.post.id,
          db_id: data.post.id,
          title: data.post.title,
          category: data.post.category,
          thumbnail: data.post.thumbnail,
          summary: data.post.summary,
          body: data.post.body,
          author: data.post.author,
          published_at: data.post.published_at,
          tags: data.post.tags,
          readTime: data.post.read_time,
          related_recipe_id: data.post.related_recipe_id,
        };
        setDrafts(prev => [post, ...prev]);
        setMessage(`✅ "${post.title}" 초안 생성 완료. 아래에서 검토 후 발행하세요.`);
      }
    } catch (e) {
      setMessage(`❌ 생성 실패: ${(e as Error).message}`);
    } finally {
      setGenerating(null);
    }
  }

  async function handlePublish(draft: BlogPost & { db_id?: string }) {
    if (!SUPABASE_URL || !ADMIN_SECRET || !draft.db_id) return;
    setPublishing(draft.db_id);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${draft.db_id}`, {
        method: 'PATCH',
        headers: {
          apikey: ADMIN_SECRET,
          Authorization: `Bearer ${ADMIN_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' }),
      });
      setDrafts(prev => prev.filter(d => d.db_id !== draft.db_id));
      setMessage(`📰 "${draft.title}" 발행 완료!`);
    } catch (e) {
      setMessage(`❌ 발행 실패: ${(e as Error).message}`);
    } finally {
      setPublishing(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔧</span>
        <div>
          <h1 className="text-xl font-black">플레이버 싱크 관리자</h1>
          <p className="text-gray-400 text-sm">Claude AI 블로그 자동 생성</p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-gray-800 border border-gray-600 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">레시피 → 블로그 생성</p>
        {mockRecipes.map(recipe => (
          <div key={recipe.id} className="bg-gray-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">{recipe.thumbnail}</span>
            <div className="flex-1">
              <p className="font-bold">{recipe.title}</p>
              <p className="text-gray-400 text-xs">{recipe.isCombo ? '2구 코스' : '1구 단품'} · {recipe.servings}인분</p>
            </div>
            <button
              onClick={() => handleGenerate(recipe)}
              disabled={generating === recipe.id}
              className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-sm font-bold touch-manipulation disabled:opacity-50"
            >
              {generating === recipe.id ? '생성 중...' : 'Claude로 생성'}
            </button>
          </div>
        ))}
      </div>

      {drafts.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">검토 대기 초안</p>
          {drafts.map(draft => (
            <div key={draft.db_id} className="bg-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{draft.thumbnail}</span>
                <div className="flex-1">
                  <span className="text-xs text-orange-400 font-bold">{draft.category}</span>
                  <p className="font-bold text-sm">{draft.title}</p>
                  <p className="text-gray-400 text-xs mt-1">{draft.summary}</p>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 text-xs text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                {draft.body}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDrafts(prev => prev.filter(d => d.db_id !== draft.db_id))}
                  className="flex-1 h-10 rounded-xl border border-gray-600 text-gray-400 text-sm touch-manipulation"
                >
                  삭제
                </button>
                <button
                  onClick={() => handlePublish(draft)}
                  disabled={publishing === draft.db_id}
                  className="flex-1 h-10 rounded-xl bg-green-600 text-white text-sm font-bold touch-manipulation disabled:opacity-50"
                >
                  {publishing === draft.db_id ? '발행 중...' : '발행하기'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-gray-800 p-4 text-xs text-gray-500 space-y-1">
        <p className="font-bold text-gray-400">Supabase 주간 자동 생성 (pg_cron)</p>
        <code className="block bg-gray-900 rounded-lg p-2 leading-relaxed">
          {`SELECT cron.schedule('weekly-blog', '0 9 * * 1',\n  $$SELECT net.http_post(\n    url:='${SUPABASE_URL ?? 'https://YOUR.supabase.co'}/functions/v1/generate-blog-post',\n    headers:='{"x-admin-secret":"SECRET"}'::jsonb,\n    body:='{"recipe_id":"r1"}'::jsonb)$$);`}
        </code>
      </div>
    </div>
  );
}
