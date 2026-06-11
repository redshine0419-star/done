'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlayCircle, Loader2, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { t, isEn } from '@/i18n';
import type { RecipeIngredient, RecipeStep } from '@/types';

interface AnalyzedRecipe {
  title: string;
  story: string;
  servings: number;
  thumbnail: string;
  youtube_id: string;
  youtube_credit: string;
  category?: string;
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
  const [dataSource, setDataSource] = useState<'transcript' | 'description' | 'title_only' | null>(null);
  const [updateTargetId, setUpdateTargetId] = useState<string>('');

  function extractVideoId(rawUrl: string): string | null {
    try {
      const u = new URL(rawUrl.trim());
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1].split('?')[0];
      return u.searchParams.get('v');
    } catch {
      return null;
    }
  }

  async function safeJson<T>(res: Response): Promise<T | null> {
    try {
      const text = await res.text();
      return JSON.parse(text) as T;
    } catch { return null; }
  }

  async function handleCheck() {
    const trimmed = url.trim();
    if (!trimmed) return;
    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setError(t.submit.invalidUrl);
      return;
    }

    setChecking(true);
    setError('');
    setRecipe(null);
    setExistingById(null);
    setExistingByTitle(null);

    try {
      // Duplicate check — skip gracefully if DB is unavailable
      let existing: ExistingRecipe | null = null;
      try {
        const res = await fetch(`/api/recipes?youtube_id=${encodeURIComponent(videoId)}`);
        existing = await safeJson<ExistingRecipe>(res);
      } catch { /* ignore duplicate check failure */ }

      if (existing && existing.id) {
        setExistingById(existing);
        setUpdateTargetId(existing.id);
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

  async function runAnalysis(rawUrl: string) {
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/analyze-recipe-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: rawUrl }),
      });
      const data = await safeJson<{ recipe?: AnalyzedRecipe; error?: string; _source?: 'transcript' | 'description' | 'title_only' }>(res);
      if (!data || !data.recipe) {
        const errMsg = data?.error ?? t.submit.analyzeError.replace('{status}', String(res.status));
        setError(errMsg);
        return;
      }
      setRecipe(data.recipe);
      setDataSource(data._source ?? null);

      // Check title duplicate (only when creating new)
      if (mode === 'new' || !updateTargetId) {
        try {
          const titleRes = await fetch(`/api/recipes?title=${encodeURIComponent(data.recipe.title)}`);
          const titleData = await safeJson<ExistingRecipe>(titleRes);
          if (titleData && titleData.id) {
            setExistingByTitle(titleData);
          }
        } catch { /* ignore */ }
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
          // Explicitly include category so undefined isn't omitted by JSON.stringify
          body: JSON.stringify({ ...recipe, category: recipe.category ?? null }),
        });
        const data = await res.json() as { ok?: boolean; error?: string };
        if (data.ok) {
          setDone({ id: updateTargetId, mode: 'update' });
        } else {
          setError(data.error ?? (isEn ? 'Update failed.' : '수정에 실패했습니다.'));
        }
      } else {
        res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...recipe, _hp: '' }),
        });
        const data = await res.json() as { id?: string; error?: string; existing_id?: string };
        if (data.id) {
          setDone({ id: data.id, mode: 'new' });
        } else if (data.existing_id) {
          setError(isEn ? 'This video is already registered. Try update mode.' : '이미 등록된 영상입니다. 업데이트 모드로 다시 시도해주세요.');
          setUpdateTargetId(data.existing_id);
        } else {
          setError(data.error ?? (isEn ? 'Submission failed.' : '등록에 실패했습니다.'));
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
          {done.mode === 'update' ? t.submit.successUpdateTitle : t.submit.successTitle}
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
          {done.mode === 'update' ? t.submit.successUpdateBody : t.submit.successBody}
        </p>
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push(`/recipe/${done.id}`)}
            className="w-full h-12 rounded-2xl font-bold text-white touch-manipulation"
            style={{ background: 'var(--brand)' }}
          >
            {t.submit.viewRecipe}
          </button>
          <button
            onClick={() => router.push('/recipe')}
            className="w-full h-12 rounded-2xl font-bold touch-manipulation"
            style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            {t.submit.backToList}
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
          {mode === 'update' && updateTargetId ? t.submit.updateTitle : t.submit.pageTitle}
        </span>
      </header>

      <div className="px-5 py-6 space-y-5">
        {/* URL input */}
        <div className="rounded-2xl p-4 space-y-3"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <PlayCircle size={18} color="#DC2626" />
            <p className="font-bold text-[15px]" style={{ color: 'var(--text-1)' }}>{t.submit.inputLabel}</p>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            {t.submit.inputDescription}
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
                {checking ? t.submit.checking : t.submit.analyzing}
              </>
            ) : t.submit.analyzeBtn}
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
              <p className="font-bold text-[14px]" style={{ color: '#92400E' }}>{t.submit.duplicateTitle}</p>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{existingById.thumbnail ?? '🍳'}</span>
                <div>
                  <p className="font-bold text-[14px]" style={{ color: 'var(--text-1)' }}>{existingById.title}</p>
                  {existingById.youtube_credit && (
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {isEn ? 'Source' : '출처'}: {existingById.youtube_credit}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[13px]" style={{ color: '#78350F' }}>
                {t.submit.duplicateBody}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyzeForUpdate}
                  disabled={analyzing}
                  className="flex-1 h-11 rounded-xl font-bold text-white touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2 text-[14px]"
                  style={{ background: '#D97706' }}
                >
                  {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {t.submit.replaceBtn}
                </button>
                <Link
                  href={`/recipe/${existingById.id}`}
                  className="flex-1 h-11 rounded-xl font-bold touch-manipulation flex items-center justify-center text-[14px]"
                  style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                >
                  {t.submit.viewExisting}
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
              {isEn
                ? <>{t.submit.similarTitle}: <b>{existingByTitle.title}</b>. {t.submit.similarHint}</>
                : <>비슷한 이름의 레시피(<b>{existingByTitle.title}</b>)가 이미 있습니다. {t.submit.similarHint}</>
              }
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
                  {mode === 'update' ? t.submit.updatePreviewTitle : t.submit.previewTitle}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {dataSource === 'transcript' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      {t.submit.dataSourceTranscript}
                    </span>
                  )}
                  {dataSource === 'description' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
                      {t.submit.dataSourceDescription}
                    </span>
                  )}
                  {dataSource === 'title_only' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                      {t.submit.dataSourceTitleOnly}
                    </span>
                  )}
                  <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>{t.submit.dataSourceHint}</span>
                </div>
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
                  <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>{t.submit.servingsLabel}</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={recipe.servings}
                    onChange={e => setRecipe(r => r ? { ...r, servings: parseInt(e.target.value) || 2 } : r)}
                    className="w-20 h-10 px-3 rounded-xl border text-center"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                  />
                </div>

                <div>
                  <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-2)' }}>{t.submit.categoryLabel}</p>
                  <div className="flex gap-2">
                    {[
                      { value: '', label: t.submit.categoryNormal },
                      { value: '베이킹', label: t.submit.categoryBaking },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRecipe(r => r ? { ...r, category: opt.value || undefined } : r)}
                        className="flex-1 h-10 rounded-xl text-[13px] font-semibold touch-manipulation"
                        style={{
                          background: (recipe.category ?? '') === opt.value ? 'var(--brand)' : 'var(--bg)',
                          color: (recipe.category ?? '') === opt.value ? 'white' : 'var(--text-2)',
                          border: `1px solid ${(recipe.category ?? '') === opt.value ? 'var(--brand)' : 'var(--border)'}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video preview — let user confirm or remove before saving */}
                {recipe.youtube_id ? (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <img
                      src={`https://img.youtube.com/vi/${recipe.youtube_id}/hqdefault.jpg`}
                      alt="영상 미리보기"
                      className="w-full object-cover"
                      style={{ maxHeight: '180px' }}
                    />
                    <div className="px-3 py-2 flex items-center gap-2" style={{ background: 'var(--bg)' }}>
                      <PlayCircle size={13} color="#DC2626" />
                      <span className="text-[12px] flex-1 truncate" style={{ color: 'var(--text-3)' }}>
                        {recipe.youtube_credit || t.submit.creditUnknown}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRecipe(r => r ? { ...r, youtube_id: '', youtube_credit: '' } : r)}
                        className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: '#FEE2E2', color: '#DC2626' }}
                      >
                        {t.submit.videoRemove}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl px-3 py-2 text-[12px]" style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    {t.submit.videoNotFound}
                  </div>
                )}

                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-2)' }}>
                    {isEn ? `${t.submit.ingredientsLabel} (${recipe.ingredients.length})` : `재료 (${recipe.ingredients.length}가지)`}
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px]">
                        <span className="flex-1 font-medium" style={{ color: 'var(--text-1)' }}>{ing.name}</span>
                        <span style={{ color: 'var(--text-3)' }}>{ing.base_amount}{ing.unit}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: ing.type === 'main' ? '#FEF0E8' : 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                          {t.recipe.ingredientType[ing.type as keyof typeof t.recipe.ingredientType]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-2)' }}>
                    {isEn ? `${t.submit.stepsLabel} (${recipe.steps.length})` : `조리 단계 (${recipe.steps.length}단계)`}
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
              {t.submit.disclaimer}
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
                  {mode === 'update' ? t.submit.updating : t.submit.submitting}
                </>
              ) : mode === 'update' ? t.submit.updateBtn : t.submit.submitBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
