'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlayCircle, Loader2, Check } from 'lucide-react';
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

export default function RecipeSubmitPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [recipe, setRecipe] = useState<AnalyzedRecipe | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setAnalyzing(true);
    setError('');
    setRecipe(null);
    try {
      const res = await fetch('/api/analyze-recipe-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url }),
      });
      const data = await res.json() as { recipe?: AnalyzedRecipe; error?: string };
      if (data.recipe) {
        setRecipe(data.recipe);
      } else {
        setError(data.error ?? '분석에 실패했습니다.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    if (!recipe) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (data.id) {
        setDone(true);
      } else {
        setError(data.error ?? '등록에 실패했습니다.');
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
             style={{ background: 'var(--green-light)' }}>
          <Check size={32} color="var(--green)" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-black mb-2" style={{ color: 'var(--text-1)' }}>등록 신청 완료!</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
          검토 후 승인되면 레시피 목록에 표시됩니다.<br />
          보통 1-2일 내로 검토가 완료됩니다.
        </p>
        <button
          onClick={() => router.push('/recipe')}
          className="w-full h-12 rounded-2xl font-bold text-white touch-manipulation"
          style={{ background: 'var(--brand)' }}
        >
          레시피 목록으로
        </button>
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
        <span className="font-semibold text-[15px]" style={{ color: 'var(--text-1)' }}>레시피 추가</span>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* URL input */}
        <div className="space-y-3">
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
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full h-12 px-4 rounded-xl text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
            />
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !url.trim()}
              className="w-full h-12 rounded-xl font-bold text-white text-[15px] touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--brand)' }}
            >
              {analyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  분석 중...
                </>
              ) : '분석하기'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Preview */}
        {recipe && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden"
                 style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--brand-light)' }}>
                <p className="font-black text-[15px]" style={{ color: 'var(--brand)' }}>분석 결과 미리보기</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>수정 후 등록하세요</p>
              </div>

              <div className="px-4 py-4 space-y-4">
                {/* Title & thumbnail */}
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

                {/* Story */}
                <textarea
                  value={recipe.story}
                  onChange={e => setRecipe(r => r ? { ...r, story: e.target.value } : r)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-[13px] resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-2)' }}
                />

                {/* Servings */}
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
                  <span className="text-[13px]" style={{ color: 'var(--text-3)' }}>참고: {recipe.youtube_credit}</span>
                </div>

                {/* Ingredients */}
                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-2)' }}>재료 ({recipe.ingredients.length}가지)</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px]">
                        <span className="flex-1 font-medium" style={{ color: 'var(--text-1)' }}>{ing.name}</span>
                        <span style={{ color: 'var(--text-3)' }}>{ing.base_amount}{ing.unit}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: ing.type === 'main' ? 'var(--brand-light)' : 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                          {ing.type === 'main' ? '주재료' : ing.type === 'seasoning' ? '양념' : '고명'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-2)' }}>조리 단계 ({recipe.steps.length}단계)</p>
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

            {/* Disclaimer */}
            <div className="rounded-xl px-4 py-3 text-[12px]" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
              등록된 레시피는 AI가 영상 제목과 채널 정보를 참고해 독립적으로 생성한 콘텐츠입니다.
              원본 영상 크리에이터의 권리를 존중합니다.
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-14 rounded-2xl font-bold text-white text-[15px] touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--brand)' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  등록 중...
                </>
              ) : '레시피 등록 신청'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
