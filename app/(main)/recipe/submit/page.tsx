'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlayCircle, Loader2, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { RecipeIngredient, RecipeStep } from '@/types';

interface AnalyzedRecipe {
  title: string;
  story: string;
  servings: number;
  thumbnail: string;
  youtube_id: string;
  youtube_credit: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

interface ExistingRecipe {
  id: string;
  title: string;
  youtube_credit?: string;
  thumbnail?: string;
  status?: string;
}

type Mode = 'new' | 'update';

export default function RecipeSubmitPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; mode: Mode } | null>(null);
  const [error, setError] = useState('');
  const [recipe, setRecipe] = useState<AnalyzedRecipe | null>(null);
  const [existingById, setExistingById] = useState<ExistingRecipe | null>(null);
  const [existingByTitle, setExistingByTitle] = useState<ExistingRecipe | null>(null);
  const [mode, setMode] = useState<Mode>('new');
  const [updateTargetId, setUpdateTargetId] = useState<string>('');

  function extractVideoId(rawUrl: string): string | null {
    try {
      const u = new URL(rawUrl.trim());
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
      return u.searchParams.get('v');
    } catch {
      return null;
    }
  }

  async function handleCheck() {
    const trimmed = url.trim();
    if (!trimmed) return;
    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setError('유효한 유튜브 URL을 입력해주세요.');
      return;
    }

    setChecking(true);
    setError('');
    setRecipe(null);
    setExistingById(null);
    setExistingByTitle(null);

    try {
      const res = await fetch(`/api/recipes?youtube_id=${encodeURIComponent(videoId)}`);
      const data = await res.json() as ExistingRecipe | null;
      if (data && data.id) {
        setExistingById(data);
        setUpdateTargetId(data.id);
        setMode('update');
      } else {
        setMode('new');
        await runAnalysis(trimmed);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  async function runAnalysis(rawUrl: string, videoId?: string) {
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/analyze-recipe-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: rawUrl }),
      });
      const data = await res.json() as { recipe?: AnalyzedRecipe; error?: string };
      if (!data.recipe) {
        setError(data.error ?? '분석에 실패했습니다.');
        return;
      }
      setRecipe(data.recipe);

      // Check title duplicate (only when creating new)
      if (mode === 'new' || !updateTargetId) {
        const titleRes = await fetch(`/api/recipes?title=${encodeURIComponent(data.recipe.title)}`);
        const titleData = await titleRes.json() as ExistingRecipe | null;
        if (titleData && titleData.id) {
          setExistingByTitle(titleData);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAnalyzeForUpdate() {
    if (!url.trim()) return;
    setMode('update');
    await runAnalysis(url.trim());
  }

  async function handleSubmit() {
    if (!recipe) return;
    setSubmitting(true);
    setError('');
    try {
      let res: Response;
      if (mode === 'update' && updateTargetId) {
        res = await fetch(`/api/recipes/${updateTargetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipe),
        });
        const data = await res.json() as { ok?: boolean; error?: string };
        if (data.ok) {
          setDone({ id: updateTargetId, mode: 'update' });
        } else {
          setError(data.error ?? '수정에 실패했습니다.');
        }
      } else {
        res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipe),
        });
        const data = await res.json() as { id?: string; error?: string; existing_id?: string };
        if (data.id) {
          setDone({ id: data.id, mode: 'new' });
        } else if (data.existing_id) {
          setError('이미 등록된 영상입니다. 업데이트 모드로 다시 시도해주세요.');
          setUpdateTargetId(data.existing_id);
        } else {
          setError(data.error ?? '등록에 실패했습니다.');
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto min-h-dvh flex flex-col items-center justify-center p-6 text-center"
           style={{ background: 'var(--bg)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
             style={{ background: '#DCFCE7' }}>
          <Check size={32} color="var(--green)" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-black mb-2" style={{ color: 'var(--text-1)' }}>
          {done.mode === 'update' ? '레시피 업데이트 완료!' : '레시피 등록 완료!'}
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
          {done.mode === 'update'
            ? '레시피가 바로 업데이트되었습니다.'
            : '레시피가 바로 공개되었습니다. 모든 사용자가 볼 수 있습니다.'}
        </p>
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push(`/recipe/${done.id}`)}
            className="w-full h-12 rounded-2xl font-bold text-white touch-manipulation"
            style={{ background: 'var(--brand)' }}
          >
            레시피 보러가기
          </button>
          <button
            onClick={() => router.push('/recipe')}
            className="w-full h-12 rounded-2xl font-bold touch-manipulation"
            style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            레시피 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-dvh pb-8" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/recipe"
              className="w-9 h-9 flex items-center justify-center rounded-xl touch-manipulation"
              style={{ background: 'var(--bg)' }}>
          <ArrowLeft size={18} color="var(--text-2)" strokeWidth={2} />
        </Link>
        <span className="font-semibold text-[15px]" style={{ color: 'var(--text-1)' }}>
          {mode === 'update' && updateTargetId ? '레시피 업데이트' : '레시피 추가'}
        </span>
      </header>

      <div className="px-5 py-6 space-y-5">
        {/* URL input */}
        <div className="rounded-2xl p-4 space-y-3"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <PlayCircle size={18} color="#DC2626" />
            <p className="font-bold text-[15px]" style={{ color: 'var(--text-1)' }}>유튜브 영상으로 레시피 추가</p>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            레시피 영상 URL을 입력하면 AI가 자동으로 레시피를 추출합니다.
          </p>
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setExistingById(null); setRecipe(null); setError(''); }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full h-12 px-4 rounded-xl text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
          />
          <button
            onClick={handleCheck}
            disabled={checking || analyzing || !url.trim()}
            className="w-full h-12 rounded-xl font-bold text-white text-[15px] touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--brand)' }}
          >
            {(checking || analyzing) ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {checking ? '중복 확인 중...' : '분석 중...'}
              </>
            ) : '분석하기'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* Duplicate URL found → offer update */}
        {existingById && !recipe && (
          <div className="rounded-2xl overflow-hidden"
               style={{ border: '1px solid #F59E0B', background: '#FFFBEB' }}>
            <div className="px-4 py-3 flex items-center gap-2"
                 style={{ borderBottom: '1px solid #FDE68A', background: '#FEF3C7' }}>
              <AlertTriangle size={16} color="#D97706" />
              <p className="font-bold text-[14px]" style={{ color: '#92400E' }}>이미 등록된 영상</p>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{existingById.thumbnail ?? '🍳'}</span>
                <div>
                  <p className="font-bold text-[14px]" style={{ color: 'var(--text-1)' }}>{existingById.title}</p>
                  {existingById.youtube_credit && (
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                      출처: {existingById.youtube_credit}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[13px]" style={{ color: '#78350F' }}>
                이 영상의 레시피가 이미 등록되어 있습니다. AI로 다시 분석해서 레시피를 교체할 수 있습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyzeForUpdate}
                  disabled={analyzing}
                  className="flex-1 h-11 rounded-xl font-bold text-white touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2 text-[14px]"
                  style={{ background: '#D97706' }}
                >
                  {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  레시피 교체하기
                </button>
                <Link
                  href={`/recipe/${existingById.id}`}
                  className="flex-1 h-11 rounded-xl font-bold touch-manipulation flex items-center justify-center text-[14px]"
                  style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                >
                  기존 레시피 보기
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Similar title warning */}
        {existingByTitle && recipe && mode === 'new' && (
          <div className="rounded-xl px-4 py-3 flex items-start gap-2 text-[13px]"
               style={{ background: '#FFF7ED', color: '#92400E', border: '1px solid #FED7AA' }}>
            <AlertTriangle size={15} className="shrink-0 mt-0.5" color="#D97706" />
            <span>
              비슷한 이름의 레시피(<b>{existingByTitle.title}</b>)가 이미 있습니다.
              그래도 등록하면 별도 레시피로 추가됩니다.
            </span>
          </div>
        )}

        {/* Preview */}
        {recipe && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden"
                 style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="px-4 py-3 border-b"
                   style={{ borderColor: 'var(--border)', background: mode === 'update' ? '#FFF7ED' : '#FEF0E8' }}>
                <p className="font-black text-[15px]"
                   style={{ color: mode === 'update' ? '#D97706' : 'var(--brand)' }}>
                  {mode === 'update' ? '교체할 레시피 미리보기' : '분석 결과 미리보기'}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>수정 후 등록하세요</p>
              </div>

              <div className="px-4 py-4 space-y-4">
                <div className="flex gap-3 items-center">
                  <input
                    value={recipe.thumbnail}
                    onChange={e => setRecipe(r => r ? { ...r, thumbnail: e.target.value } : r)}
                    className="w-14 h-14 text-3xl text-center rounded-xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  />
                  <div className="flex-1">
                    <input
                      value={recipe.title}
                      onChange={e => setRecipe(r => r ? { ...r, title: e.target.value } : r)}
                      className="w-full h-12 px-3 rounded-xl border font-bold"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                    />
                  </div>
                </div>

                <textarea
                  value={recipe.story}
                  onChange={e => setRecipe(r => r ? { ...r, story: e.target.value } : r)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-[13px] resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-2)' }}
                />

                <div className="flex items-center gap-3">
                  <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>인분</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={recipe.servings}
                    onChange={e => setRecipe(r => r ? { ...r, servings: parseInt(e.target.value) || 2 } : r)}
                    className="w-20 h-10 px-3 rounded-xl border text-center"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                  />
                  {recipe.youtube_credit && (
                    <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>출처: {recipe.youtube_credit}</span>
                  )}
                </div>

                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-2)' }}>
                    재료 ({recipe.ingredients.length}가지)
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px]">
                        <span className="flex-1 font-medium" style={{ color: 'var(--text-1)' }}>{ing.name}</span>
                        <span style={{ color: 'var(--text-3)' }}>{ing.base_amount}{ing.unit}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: ing.type === 'main' ? '#FEF0E8' : 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                          {ing.type === 'main' ? '주재료' : ing.type === 'seasoning' ? '양념' : '고명'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-2)' }}>
                    조리 단계 ({recipe.steps.length}단계)
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recipe.steps.map((step, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                              style={{ background: 'var(--brand)', color: 'white' }}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{step.action}</p>
                          <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 text-[12px]"
                 style={{ background: '#FEFCE8', color: '#854D0E', border: '1px solid #FEF08A' }}>
              등록된 레시피는 AI가 영상 제목과 채널 정보를 참고해 독립적으로 생성한 콘텐츠입니다.
              원본 영상 크리에이터의 권리를 존중합니다.
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-14 rounded-2xl font-bold text-white text-[15px] touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: mode === 'update' ? '#D97706' : 'var(--brand)' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'update' ? '업데이트 중...' : '등록 중...'}
                </>
              ) : mode === 'update' ? '레시피 교체하기' : '레시피 등록하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
