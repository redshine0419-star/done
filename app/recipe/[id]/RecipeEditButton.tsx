'use client';
import { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, Loader2, Check } from 'lucide-react';
import type { RecipeIngredient, RecipeStep } from '@/types';

interface Props {
  recipeId: string;
  initial: {
    title: string;
    story: string;
    servings: number;
    thumbnail: string;
    youtube_id?: string;
    youtube_credit?: string;
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
  };
}

const ING_TYPES = ['main', 'seasoning', 'garnish'] as const;
const ING_TYPE_LABEL: Record<string, string> = { main: '주재료', seasoning: '양념', garnish: '고명' };
const BURNER_OPTIONS = [
  { value: '', label: '없음 (베이킹·디저트)' },
  { value: '1', label: '1구' },
  { value: '2', label: '2구' },
];

export function RecipeEditButton({ recipeId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(initial.title);
  const [thumbnail, setThumbnail] = useState(initial.thumbnail);
  const [story, setStory] = useState(initial.story);
  const [servings, setServings] = useState(String(initial.servings));
  const [youtubeId, setYoutubeId] = useState(initial.youtube_id ?? '');
  const [youtubeCredit, setYoutubeCredit] = useState(initial.youtube_credit ?? '');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initial.ingredients.map(i => ({ ...i }))
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    initial.steps.map(s => ({ ...s }))
  );

  function resetForm() {
    setTitle(initial.title);
    setThumbnail(initial.thumbnail);
    setStory(initial.story);
    setServings(String(initial.servings));
    setYoutubeId(initial.youtube_id ?? '');
    setYoutubeCredit(initial.youtube_credit ?? '');
    setIngredients(initial.ingredients.map(i => ({ ...i })));
    setSteps(initial.steps.map(s => ({ ...s })));
    setError('');
    setDone(false);
  }

  function handleOpen() { resetForm(); setOpen(true); }
  function handleClose() { setOpen(false); }

  // Ingredient helpers
  function updateIng(idx: number, patch: Partial<RecipeIngredient>) {
    setIngredients(list => list.map((ing, i) => i === idx ? { ...ing, ...patch } : ing));
  }
  function removeIng(idx: number) {
    setIngredients(list => list.filter((_, i) => i !== idx));
  }
  function addIng() {
    setIngredients(list => [...list, { ingredient_id: `new_${Date.now()}`, name: '', base_amount: 0, unit: 'g', type: 'main' }]);
  }

  // Step helpers
  function updateStep(idx: number, patch: Partial<RecipeStep>) {
    setSteps(list => list.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }
  function removeStep(idx: number) {
    setSteps(list => list.filter((_, i) => i !== idx));
  }
  function addStep() {
    setSteps(list => [...list, { burner: null, action: '', duration_sec: 60, description: '' }]);
  }

  async function handleSave() {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          thumbnail,
          story: story.trim(),
          servings: parseInt(servings) || 2,
          youtube_id: youtubeId.trim() || null,
          youtube_credit: youtubeCredit.trim(),
          ingredients: ingredients.filter(i => i.name.trim()),
          steps: steps.filter(s => s.action.trim()),
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) {
        setDone(true);
        setTimeout(() => { handleClose(); }, 1500);
      } else {
        setError(data.error ?? '저장에 실패했습니다.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full h-11 rounded-2xl text-sm font-semibold touch-manipulation"
        style={{ border: '1px solid var(--border)', color: 'var(--text-3)', background: 'var(--surface)' }}
      >
        ✏️ 레시피 수정하기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
               style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-xl touch-manipulation"
                    style={{ background: 'var(--bg)' }}>
              <X size={18} color="var(--text-2)" strokeWidth={2} />
            </button>
            <span className="font-bold text-[15px]" style={{ color: 'var(--text-1)' }}>레시피 수정</span>
            <button
              onClick={handleSave}
              disabled={saving || done}
              className="h-9 px-4 rounded-xl text-[13px] font-bold text-white touch-manipulation disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: done ? 'var(--green)' : 'var(--brand)' }}
            >
              {done ? <><Check size={14} strokeWidth={2.5} /> 완료</> : saving ? <><Loader2 size={14} className="animate-spin" /> 저장 중</> : '저장'}
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 max-w-md mx-auto w-full">

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                {error}
              </div>
            )}

            {/* Basic info */}
            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>기본 정보</h3>

              <div className="flex gap-3 items-center">
                <input
                  value={thumbnail}
                  onChange={e => setThumbnail(e.target.value)}
                  className="w-14 h-14 text-3xl text-center rounded-xl border"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  placeholder="🍳"
                />
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="레시피 제목"
                  className="flex-1 h-14 px-4 rounded-xl border font-bold text-[15px]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-1)' }}
                />
              </div>

              <textarea
                value={story}
                onChange={e => setStory(e.target.value)}
                rows={3}
                placeholder="레시피 소개"
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-2)' }}
              />

              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>인분 수</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={e => setServings(e.target.value)}
                  className="w-20 h-10 px-3 rounded-xl border text-center font-bold"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-1)' }}
                />
              </div>
            </section>

            {/* YouTube */}
            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>유튜브 영상</h3>
              <input
                value={youtubeId}
                onChange={e => setYoutubeId(e.target.value)}
                placeholder="YouTube Video ID (예: dQw4w9WgXcQ)"
                className="w-full h-11 px-4 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-1)' }}
              />
              <input
                value={youtubeCredit}
                onChange={e => setYoutubeCredit(e.target.value)}
                placeholder="채널명 (예: KBS 엔터테인먼트)"
                className="w-full h-11 px-4 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-1)' }}
              />
              {youtubeId && (
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt="영상 미리보기"
                  className="w-full rounded-xl object-cover"
                  style={{ maxHeight: '160px', border: '1px solid var(--border)' }}
                />
              )}
            </section>

            {/* Ingredients */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                  재료 ({ingredients.length}가지)
                </h3>
                <button
                  onClick={addIng}
                  className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-xl touch-manipulation"
                  style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                >
                  <Plus size={13} strokeWidth={2.5} /> 추가
                </button>
              </div>

              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="rounded-xl p-3 space-y-2"
                       style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <input
                        value={ing.name}
                        onChange={e => updateIng(idx, { name: e.target.value })}
                        placeholder="재료명"
                        className="flex-1 h-9 px-3 rounded-lg border text-sm font-semibold"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                      />
                      <button onClick={() => removeIng(idx)} className="shrink-0 p-1.5 rounded-lg touch-manipulation"
                              style={{ background: '#FEE2E2' }}>
                        <Trash2 size={14} color="#DC2626" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={ing.base_amount}
                        onChange={e => updateIng(idx, { base_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="양"
                        className="w-20 h-9 px-3 rounded-lg border text-sm text-center"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                      />
                      <input
                        value={ing.unit}
                        onChange={e => updateIng(idx, { unit: e.target.value })}
                        placeholder="단위"
                        className="w-16 h-9 px-3 rounded-lg border text-sm text-center"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                      />
                      <div className="relative flex-1">
                        <select
                          value={ing.type}
                          onChange={e => updateIng(idx, { type: e.target.value as RecipeIngredient['type'] })}
                          className="w-full h-9 px-3 pr-8 rounded-lg border text-sm appearance-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-2)' }}
                        >
                          {ING_TYPES.map(t => <option key={t} value={t}>{ING_TYPE_LABEL[t]}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" color="var(--text-3)" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Steps */}
            <section className="space-y-3 pb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                  조리 단계 ({steps.length}단계)
                </h3>
                <button
                  onClick={addStep}
                  className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-xl touch-manipulation"
                  style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                >
                  <Plus size={13} strokeWidth={2.5} /> 추가
                </button>
              </div>

              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div key={idx} className="rounded-xl p-3 space-y-2"
                       style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                            style={{ background: 'var(--brand)', color: 'white' }}>
                        {idx + 1}
                      </span>
                      <input
                        value={step.action}
                        onChange={e => updateStep(idx, { action: e.target.value })}
                        placeholder="단계명 (예: 재료 볶기)"
                        className="flex-1 h-9 px-3 rounded-lg border text-sm font-semibold"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                      />
                      <button onClick={() => removeStep(idx)} className="shrink-0 p-1.5 rounded-lg touch-manipulation"
                              style={{ background: '#FEE2E2' }}>
                        <Trash2 size={14} color="#DC2626" strokeWidth={2} />
                      </button>
                    </div>
                    <textarea
                      value={step.description}
                      onChange={e => updateStep(idx, { description: e.target.value })}
                      rows={2}
                      placeholder="설명"
                      className="w-full px-3 py-2 rounded-lg border text-[13px] resize-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-2)' }}
                    />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[12px] shrink-0" style={{ color: 'var(--text-3)' }}>시간</span>
                        <input
                          type="number"
                          min="1"
                          value={Math.round(step.duration_sec / 60)}
                          onChange={e => updateStep(idx, { duration_sec: (parseInt(e.target.value) || 1) * 60 })}
                          className="w-16 h-9 px-2 rounded-lg border text-sm text-center"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-1)' }}
                        />
                        <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>분</span>
                      </div>
                      <div className="relative flex-1">
                        <select
                          value={step.burner === null ? '' : String(step.burner)}
                          onChange={e => updateStep(idx, { burner: e.target.value === '' ? null : Number(e.target.value) as 1 | 2 })}
                          className="w-full h-9 px-3 pr-8 rounded-lg border text-sm appearance-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-2)' }}
                        >
                          {BURNER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" color="var(--text-3)" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      )}
    </>
  );
}
