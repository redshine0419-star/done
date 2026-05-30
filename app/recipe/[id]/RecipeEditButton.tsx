'use client';
import { useState } from 'react';

interface Props {
  recipeId: string;
  initial: {
    title: string;
    story: string;
    servings: number;
    youtube_id?: string;
    youtube_credit?: string;
  };
}

export function RecipeEditButton({ recipeId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: initial.title,
    story: initial.story,
    servings: String(initial.servings),
    youtube_id: initial.youtube_id ?? '',
    youtube_credit: initial.youtube_credit ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          story: form.story,
          servings: parseInt(form.servings) || 2,
          youtube_id: form.youtube_id || null,
          youtube_credit: form.youtube_credit,
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => { setOpen(false); setDone(false); }, 1500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
      >
        ✏️ 레시피 수정하기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">레시피 수정</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            {[
              { label: '제목', key: 'title' as const },
              { label: '소개', key: 'story' as const },
              { label: '인분 수', key: 'servings' as const },
              { label: 'YouTube ID (선택)', key: 'youtube_id' as const },
              { label: 'YouTube 채널명 (선택)', key: 'youtube_credit' as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                {key === 'story' ? (
                  <textarea
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                ) : (
                  <input
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    type={key === 'servings' ? 'number' : 'text'}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                )}
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={saving || done}
              className="w-full h-12 rounded-2xl bg-[#FF6B35] text-white font-bold disabled:opacity-60"
            >
              {done ? '✅ 수정 완료!' : saving ? '저장 중...' : '수정 저장하기'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
