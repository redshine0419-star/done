'use client';
import { useState, useEffect } from 'react';
import { mockRecipes } from '@/data/mockRecipes';
import type { BlogPost, Recipe } from '@/types';

type Tab = 'blog' | 'blog-manage' | 'recipes';

interface DbRecipe extends Recipe {
  status: string;
  submitted_by?: string;
  created_at?: string;
}

interface EditState {
  title: string;
  story: string;
  servings: string;
  youtube_id: string;
  youtube_credit: string;
}

export function AdminScreen() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('blog');

  // Blog state
  const [generating, setGenerating] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<(BlogPost & { db_id?: string })[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);

  // Blog manage state
  const [allPosts, setAllPosts] = useState<(BlogPost & { db_id: string; status: string })[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postEditState, setPostEditState] = useState({ title: '', summary: '', body: '', category: '', thumbnail: '', tags: '' });
  const [postAction, setPostAction] = useState<string | null>(null);

  // Recipe state
  const [dbRecipes, setDbRecipes] = useState<DbRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ title: '', story: '', servings: '2', youtube_id: '', youtube_credit: '' });
  const [recipeAction, setRecipeAction] = useState<string | null>(null);

  const [message, setMessage] = useState('');

  async function loadDbRecipes() {
    setLoadingRecipes(true);
    try {
      const res = await fetch('/api/recipes', {
        headers: { 'x-admin-secret': secret },
      });
      const data = await res.json() as DbRecipe[];
      if (Array.isArray(data)) setDbRecipes(data);
    } catch {
      // ignore
    } finally {
      setLoadingRecipes(false);
    }
  }

  async function loadDrafts(currentSecret?: string) {
    const s = currentSecret ?? secret;
    try {
      const res = await fetch('/api/blog-posts?status=draft', {
        headers: { 'x-admin-secret': s },
      });
      if (!res.ok) {
        setMessage(`❌ draft 로드 실패 (${res.status})`);
        return;
      }
      const rows = await res.json() as (Record<string, unknown>)[];
      if (!Array.isArray(rows)) return;
      const loaded: (BlogPost & { db_id: string })[] = rows.map(r => ({
        id: r.id as string,
        db_id: r.id as string,
        title: r.title as string,
        category: r.category as BlogPost['category'],
        thumbnail: r.thumbnail as string,
        summary: r.summary as string,
        body: r.body as string,
        author: r.author as string,
        published_at: r.published_at as string,
        tags: r.tags as string[],
        readTime: r.readTime as number,
        related_recipe_id: r.related_recipe_id as string | undefined,
      }));
      setDrafts(loaded);
    } catch (err) {
      setMessage(`❌ draft 로드 오류: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function loadAllPosts() {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/blog-posts?status=all', { headers: { 'x-admin-secret': secret } });
      const data = await res.json() as Record<string, unknown>[];
      if (Array.isArray(data)) {
        setAllPosts(data.map(r => ({
          id: r.id as string, db_id: r.id as string,
          title: r.title as string, category: r.category as BlogPost['category'],
          thumbnail: r.thumbnail as string, summary: r.summary as string,
          body: r.body as string, author: r.author as string,
          published_at: r.published_at as string,
          tags: Array.isArray(r.tags) ? r.tags as string[] : [],
          readTime: r.readTime as number,
          related_recipe_id: r.related_recipe_id as string | undefined,
          status: r.status as string,
        })));
      }
    } catch { /* ignore */ } finally { setLoadingPosts(false); }
  }

  async function handlePostEdit(id: string) {
    setPostAction(id);
    try {
      const res = await fetch(`/api/blog-posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          title: postEditState.title,
          summary: postEditState.summary,
          body: postEditState.body,
          category: postEditState.category,
          thumbnail: postEditState.thumbnail,
          tags: postEditState.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!data.ok) { setMessage(`❌ 수정 실패: ${data.error ?? '알 수 없는 오류'}`); return; }
      setAllPosts(prev => prev.map(p => p.id === id ? {
        ...p, title: postEditState.title, summary: postEditState.summary,
        body: postEditState.body, category: postEditState.category as BlogPost['category'],
        thumbnail: postEditState.thumbnail,
        tags: postEditState.tags.split(',').map(t => t.trim()).filter(Boolean),
      } : p));
      setEditingPostId(null);
      setMessage('✅ 블로그 수정 완료');
    } catch (e) { setMessage(`❌ 오류: ${(e as Error).message}`); }
    finally { setPostAction(null); }
  }

  async function handlePostDelete(id: string) {
    if (!confirm('포스트를 삭제하시겠습니까?')) return;
    setPostAction(id);
    try {
      await fetch(`/api/blog-posts/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      setAllPosts(prev => prev.filter(p => p.id !== id));
      setMessage('🗑️ 포스트 삭제 완료');
    } catch (e) { setMessage(`❌ 오류: ${(e as Error).message}`); }
    finally { setPostAction(null); }
  }

  async function handlePostStatus(id: string, status: 'draft' | 'published') {
    setPostAction(id);
    try {
      await fetch(`/api/blog-posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ status }),
      });
      setAllPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      setMessage(`✅ 상태 변경 완료`);
    } catch (e) { setMessage(`❌ 오류: ${(e as Error).message}`); }
    finally { setPostAction(null); }
  }

  useEffect(() => {
    if (authed && tab === 'recipes') loadDbRecipes();
    if (authed && tab === 'blog-manage') loadAllPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab]);

  async function handleGenerate(recipe: Recipe) {
    setGenerating(recipe.id);
    setMessage('');
    try {
      const res = await fetch('/api/generate-blog-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ recipe }),
      });
      const text = await res.text();
      if (text.trimStart().startsWith('<')) {
        const preview = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
        setMessage(`❌ 서버 오류 (${res.status}): ${preview}`);
        return;
      }
      const data = JSON.parse(text) as { post?: Record<string, unknown>; error?: string };
      if (data.post) {
        const post: BlogPost & { db_id: string } = {
          id: data.post.id as string,
          db_id: data.post.id as string,
          title: data.post.title as string,
          category: data.post.category as BlogPost['category'],
          thumbnail: data.post.thumbnail as string,
          summary: data.post.summary as string,
          body: data.post.body as string,
          author: data.post.author as string,
          published_at: data.post.published_at as string,
          tags: data.post.tags as string[],
          readTime: data.post.read_time as number,
          related_recipe_id: data.post.related_recipe_id as string | undefined,
        };
        setDrafts(prev => [post, ...prev]);
        setMessage(`✅ "${post.title}" 초안 생성 완료. 아래에서 검토 후 발행하세요.`);
      } else {
        setMessage(`❌ 생성 실패: ${data.error ?? '알 수 없는 오류'}`);
      }
    } catch (e) {
      setMessage(`❌ 생성 실패: ${(e as Error).message}`);
    } finally {
      setGenerating(null);
    }
  }

  async function handlePublish(draft: BlogPost & { db_id?: string }) {
    if (!secret || !draft.db_id) return;
    setPublishing(draft.db_id);
    try {
      await fetch('/api/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ post_id: draft.db_id }),
      });
      setDrafts(prev => prev.filter(d => d.db_id !== draft.db_id));
      setMessage(`📰 "${draft.title}" 발행 완료!`);
    } catch (e) {
      setMessage(`❌ 발행 실패: ${(e as Error).message}`);
    } finally {
      setPublishing(null);
    }
  }

  async function handleRecipeStatus(id: string, status: 'published' | 'rejected') {
    setRecipeAction(id);
    try {
      await fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ status }),
      });
      setDbRecipes(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setMessage(`✅ 상태 변경 완료`);
    } catch (e) {
      setMessage(`❌ 오류: ${(e as Error).message}`);
    } finally {
      setRecipeAction(null);
    }
  }

  async function handleRecipeDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setRecipeAction(id);
    try {
      await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      });
      setDbRecipes(prev => prev.filter(r => r.id !== id));
      setMessage(`🗑️ 레시피 삭제 완료`);
    } catch (e) {
      setMessage(`❌ 오류: ${(e as Error).message}`);
    } finally {
      setRecipeAction(null);
    }
  }

  function startEdit(recipe: DbRecipe) {
    setEditingId(recipe.id);
    setEditState({
      title: recipe.title,
      story: recipe.story,
      servings: String(recipe.servings),
      youtube_id: recipe.youtube_id ?? '',
      youtube_credit: recipe.youtube_credit ?? '',
    });
  }

  async function handleRecipeEdit(id: string) {
    setRecipeAction(id);
    try {
      await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          title: editState.title,
          story: editState.story,
          servings: parseInt(editState.servings) || 2,
          youtube_id: editState.youtube_id || null,
          youtube_credit: editState.youtube_credit,
        }),
      });
      setDbRecipes(prev => prev.map(r => r.id === id ? {
        ...r,
        title: editState.title,
        story: editState.story,
        servings: parseInt(editState.servings) || 2,
        youtube_id: editState.youtube_id || undefined,
        youtube_credit: editState.youtube_credit,
      } : r));
      setEditingId(null);
      setMessage('✅ 수정 완료');
    } catch (e) {
      setMessage(`❌ 오류: ${(e as Error).message}`);
    } finally {
      setRecipeAction(null);
    }
  }

  async function handleAuth() {
    if (!secret) return;
    try {
      const res = await fetch('/api/blog-posts?status=draft', {
        headers: { 'x-admin-secret': secret },
      });
      if (res.status === 401) {
        setMessage('❌ 비밀번호가 틀렸습니다');
        return;
      }
      const rows = await res.json() as (Record<string, unknown>)[];
      if (Array.isArray(rows)) {
        const loaded: (BlogPost & { db_id: string })[] = rows.map(r => ({
          id: r.id as string,
          db_id: r.id as string,
          title: r.title as string,
          category: r.category as BlogPost['category'],
          thumbnail: r.thumbnail as string,
          summary: r.summary as string,
          body: r.body as string,
          author: r.author as string,
          published_at: r.published_at as string,
          tags: r.tags as string[],
          readTime: r.readTime as number,
          related_recipe_id: r.related_recipe_id as string | undefined,
        }));
        setDrafts(loaded);
      }
      setAuthed(true);
    } catch {
      setMessage('❌ 서버 연결 실패');
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <span className="text-5xl">🔧</span>
            <h1 className="text-xl font-black mt-3">관리자 로그인</h1>
          </div>
          {message && <p className="text-center text-sm text-red-400">{message}</p>}
          <input
            type="password"
            placeholder="ADMIN_SECRET 입력"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={handleAuth}
            className="w-full h-12 rounded-xl bg-[#FF6B35] text-white font-bold"
          >
            입력
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔧</span>
        <div>
          <h1 className="text-xl font-black">플레이버 싱크 관리자</h1>
          <p className="text-gray-400 text-sm">콘텐츠 관리</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-800 rounded-2xl p-1">
        {([['blog', '블로그 생성'], ['blog-manage', '블로그 관리'], ['recipes', '레시피 관리']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 h-10 rounded-xl text-xs font-bold touch-manipulation transition-colors ${tab === key ? 'bg-[#FF6B35] text-white' : 'text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-xl bg-gray-800 border border-gray-600 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {/* Blog tab */}
      {tab === 'blog' && (
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
                {generating === recipe.id ? '생성 중...' : 'Gemini로 생성'}
              </button>
            </div>
          ))}

          {drafts.length > 0 && (
            <div className="space-y-3 pt-2">
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
            <p className="font-bold text-gray-400">Vercel Cron 주간 자동 생성</p>
            <p className="text-gray-500">매주 월요일 오전 9시 자동으로 블로그 포스트를 생성합니다.</p>
            <code className="block bg-gray-900 rounded-lg p-2 leading-relaxed mt-2 whitespace-pre">
              {`// vercel.json\n{\n  "crons": [{\n    "path": "/api/generate-blog-post",\n    "schedule": "0 9 * * 1"\n  }]\n}`}
            </code>
            <p className="text-gray-600 mt-1">※ Vercel Pro 플랜 이상에서 Cron 사용 가능</p>
          </div>
        </div>
      )}

      {/* Blog manage tab */}
      {tab === 'blog-manage' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">전체 블로그 포스트 ({allPosts.length})</p>
            <button onClick={loadAllPosts} className="text-xs text-orange-400 font-bold touch-manipulation">새로고침</button>
          </div>

          {loadingPosts && <div className="text-center py-8 text-gray-500 text-sm">불러오는 중...</div>}
          {!loadingPosts && allPosts.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm rounded-2xl bg-gray-800">등록된 포스트가 없습니다.</div>
          )}

          {allPosts.map(post => (
            <div key={post.id} className="bg-gray-800 rounded-2xl p-4 space-y-3">
              {editingPostId === post.id ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input value={postEditState.thumbnail}
                      onChange={e => setPostEditState(s => ({ ...s, thumbnail: e.target.value }))}
                      className="w-12 h-10 bg-gray-700 rounded-xl px-2 text-white text-center text-xl border border-gray-600"
                      placeholder="🍳" />
                    <input value={postEditState.title}
                      onChange={e => setPostEditState(s => ({ ...s, title: e.target.value }))}
                      placeholder="제목" className="flex-1 h-10 bg-gray-700 rounded-xl px-3 text-white text-sm border border-gray-600" />
                  </div>
                  <input value={postEditState.category}
                    onChange={e => setPostEditState(s => ({ ...s, category: e.target.value }))}
                    placeholder="카테고리" className="w-full h-10 bg-gray-700 rounded-xl px-3 text-white text-sm border border-gray-600" />
                  <textarea value={postEditState.summary}
                    onChange={e => setPostEditState(s => ({ ...s, summary: e.target.value }))}
                    rows={2} placeholder="요약"
                    className="w-full bg-gray-700 rounded-xl px-3 py-2 text-white text-sm border border-gray-600 resize-none" />
                  <textarea value={postEditState.body}
                    onChange={e => setPostEditState(s => ({ ...s, body: e.target.value }))}
                    rows={8} placeholder="본문 (마크다운)"
                    className="w-full bg-gray-700 rounded-xl px-3 py-2 text-white text-sm border border-gray-600 resize-none font-mono" />
                  <input value={postEditState.tags}
                    onChange={e => setPostEditState(s => ({ ...s, tags: e.target.value }))}
                    placeholder="태그 (쉼표 구분)" className="w-full h-10 bg-gray-700 rounded-xl px-3 text-white text-sm border border-gray-600" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingPostId(null)}
                      className="flex-1 h-10 rounded-xl border border-gray-600 text-gray-400 text-sm touch-manipulation">취소</button>
                    <button onClick={() => handlePostEdit(post.id)} disabled={postAction === post.id}
                      className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-bold touch-manipulation disabled:opacity-50">
                      {postAction === post.id ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{post.thumbnail}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate">{post.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          post.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                        }`}>{post.status === 'published' ? '공개' : '초안'}</span>
                      </div>
                      <p className="text-orange-400 text-xs">{post.category}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{post.summary}</p>
                      <p className="text-gray-600 text-xs mt-1">{String(post.published_at ?? '').slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingPostId(post.id);
                      setPostEditState({ title: post.title, summary: post.summary, body: post.body, category: post.category ?? '', thumbnail: post.thumbnail, tags: post.tags.join(', ') });
                    }} className="flex-1 h-9 rounded-xl bg-blue-800 text-blue-200 text-xs font-bold touch-manipulation">수정</button>
                    <button onClick={() => handlePostStatus(post.id, post.status === 'published' ? 'draft' : 'published')}
                      disabled={postAction === post.id}
                      className="flex-1 h-9 rounded-xl bg-gray-700 text-gray-300 text-xs font-bold touch-manipulation disabled:opacity-50">
                      {post.status === 'published' ? '비공개' : '공개'}
                    </button>
                    <button onClick={() => handlePostDelete(post.id)} disabled={postAction === post.id}
                      className="h-9 px-3 rounded-xl bg-red-900 text-red-300 text-xs font-bold touch-manipulation disabled:opacity-50">삭제</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recipes tab */}
      {tab === 'recipes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">DB 등록 레시피</p>
            <button
              onClick={loadDbRecipes}
              className="text-xs text-orange-400 font-bold touch-manipulation"
            >
              새로고침
            </button>
          </div>

          {loadingRecipes && (
            <div className="text-center py-8 text-gray-500 text-sm">불러오는 중...</div>
          )}

          {!loadingRecipes && dbRecipes.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm rounded-2xl bg-gray-800">
              <p>등록된 DB 레시피가 없습니다.</p>
              <p className="text-xs mt-1 text-gray-700">위키 등록 페이지에서 추가된 레시피가 표시됩니다.</p>
            </div>
          )}

          {dbRecipes.map(recipe => (
            <div key={recipe.id} className="bg-gray-800 rounded-2xl p-4 space-y-3">
              {editingId === recipe.id ? (
                <div className="space-y-2">
                  <input
                    value={editState.title}
                    onChange={e => setEditState(s => ({ ...s, title: e.target.value }))}
                    placeholder="제목"
                    className="w-full h-10 bg-gray-700 rounded-xl px-3 text-white text-sm border border-gray-600"
                  />
                  <textarea
                    value={editState.story}
                    onChange={e => setEditState(s => ({ ...s, story: e.target.value }))}
                    rows={2}
                    placeholder="스토리"
                    className="w-full bg-gray-700 rounded-xl px-3 py-2 text-white text-sm border border-gray-600 resize-none"
                  />
                  <div className="flex gap-2">
                    <input
                      value={editState.servings}
                      onChange={e => setEditState(s => ({ ...s, servings: e.target.value }))}
                      type="number"
                      placeholder="인분"
                      className="w-20 h-10 bg-gray-700 rounded-xl px-3 text-white text-sm border border-gray-600"
                    />
                    <input
                      value={editState.youtube_id}
                      onChange={e => setEditState(s => ({ ...s, youtube_id: e.target.value }))}
                      placeholder="유튜브 ID"
                      className="flex-1 h-10 bg-gray-700 rounded-xl px-3 text-white text-sm border border-gray-600"
                    />
                  </div>
                  <input
                    value={editState.youtube_credit}
                    onChange={e => setEditState(s => ({ ...s, youtube_credit: e.target.value }))}
                    placeholder="유튜브 채널명"
                    className="w-full h-10 bg-gray-700 rounded-xl px-3 text-white text-sm border border-gray-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 h-10 rounded-xl border border-gray-600 text-gray-400 text-sm touch-manipulation"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleRecipeEdit(recipe.id)}
                      disabled={recipeAction === recipe.id}
                      className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-bold touch-manipulation disabled:opacity-50"
                    >
                      {recipeAction === recipe.id ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{recipe.thumbnail}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{recipe.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          recipe.status === 'published' ? 'bg-green-900 text-green-300' :
                          recipe.status === 'rejected' ? 'bg-red-900 text-red-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {recipe.status === 'published' ? '승인' : recipe.status === 'rejected' ? '거절' : '대기'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{recipe.servings}인분 · {recipe.submitted_by ?? 'anonymous'}</p>
                      {recipe.youtube_credit && (
                        <p className="text-gray-500 text-xs">참고: {recipe.youtube_credit}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {recipe.status !== 'published' && (
                      <button
                        onClick={() => handleRecipeStatus(recipe.id, 'published')}
                        disabled={recipeAction === recipe.id}
                        className="flex-1 h-9 rounded-xl bg-green-700 text-white text-xs font-bold touch-manipulation disabled:opacity-50"
                      >
                        승인
                      </button>
                    )}
                    {recipe.status !== 'rejected' && (
                      <button
                        onClick={() => handleRecipeStatus(recipe.id, 'rejected')}
                        disabled={recipeAction === recipe.id}
                        className="flex-1 h-9 rounded-xl bg-gray-700 text-gray-300 text-xs font-bold touch-manipulation disabled:opacity-50"
                      >
                        거절
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(recipe)}
                      className="flex-1 h-9 rounded-xl bg-blue-800 text-blue-200 text-xs font-bold touch-manipulation"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleRecipeDelete(recipe.id)}
                      disabled={recipeAction === recipe.id}
                      className="h-9 px-3 rounded-xl bg-red-900 text-red-300 text-xs font-bold touch-manipulation disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
