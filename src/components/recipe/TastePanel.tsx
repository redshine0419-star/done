'use client';
import { useState } from 'react';
import { Settings2, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TASTE_LABELS } from '@/constants/taste';

const TASTES = [
  { key: 'spicy' as const, label: '맵기', emoji: '🌶️', active: 'bg-red-100 text-red-600' },
  { key: 'sweet' as const, label: '단맛', emoji: '🍯', active: 'bg-yellow-100 text-yellow-700' },
  { key: 'salty' as const, label: '염도', emoji: '🧂', active: 'bg-blue-100 text-blue-600' },
];

export function TastePanel() {
  const { state, dispatch } = useApp();
  const { tasteProfile } = state;
  const [open, setOpen] = useState(false);

  function update(key: 'spicy' | 'sweet' | 'salty', val: 1 | 2 | 3) {
    dispatch({ type: 'UPDATE_TASTE', payload: { ...tasteProfile, [key]: val } });
  }

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 touch-manipulation"
      >
        <Settings2 size={15} color="var(--text-2)" strokeWidth={2} />
        <span className="text-[13px] font-bold flex-1 text-left" style={{ color: 'var(--text-2)' }}>
          내 입맛 설정
        </span>
        <div className="flex gap-1.5">
          {TASTES.map(t => (
            <span key={t.key} className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${t.active}`}>
              {t.emoji} {TASTE_LABELS[tasteProfile[t.key]]}
            </span>
          ))}
        </div>
        <ChevronDown
          size={14}
          color="var(--text-3)"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {TASTES.map(t => (
              <div key={t.key}>
                <p className="text-[11px] font-bold mb-2 text-center" style={{ color: 'var(--text-3)' }}>
                  {t.emoji} {t.label}
                </p>
                <div className="flex flex-col gap-1.5">
                  {([1, 2, 3] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => update(t.key, v)}
                      className={`h-9 rounded-xl text-[12px] font-bold touch-manipulation transition-colors ${
                        tasteProfile[t.key] === v ? t.active : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {TASTE_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--text-3)' }}>
            설정한 입맛 기준으로 레시피 재료량이 조정됩니다
          </p>
        </div>
      )}
    </div>
  );
}
