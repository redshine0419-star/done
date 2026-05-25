'use client';
import { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { OcrReviewModal } from '@/components/fridge/OcrReviewModal';
import { expireDateFromDays } from '@/utils/expiry';
import type { FridgeItem } from '@/types';

type Stage = 'idle' | 'loading' | 'review' | 'error';

interface ExtractedItem {
  name: string;
  icon: string;
  amount: number;
  unit: string;
}

async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise(resolve => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.src = objectUrl;
  });
}

export function OcrBanner() {
  const { dispatch } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [extracted, setExtracted] = useState<ExtractedItem[]>([]);
  const [errMsg, setErrMsg] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setStage('loading');
    try {
      const { base64, mimeType } = await compressImage(file);
      const res = await fetch('/api/ocr-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      const data = await res.json() as { ingredients?: ExtractedItem[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? '인식 실패');
      setExtracted(data.ingredients ?? []);
      setStage('review');
    } catch (err) {
      setErrMsg((err as Error).message);
      setStage('error');
    }
  }

  function handleConfirm(items: Omit<FridgeItem, 'ingredient_id' | 'registered_at'>[]) {
    items.forEach(item => {
      dispatch({
        type: 'ADD_FRIDGE_ITEM',
        payload: {
          ...item,
          ingredient_id: `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          registered_at: new Date().toISOString(),
          expire_date: item.expire_date || expireDateFromDays(7),
        },
      });
    });
    setStage('idle');
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
             className="hidden" onChange={handleFileChange} />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={stage === 'loading'}
        className="w-full rounded-2xl p-4 text-left touch-manipulation disabled:opacity-70 transition-opacity"
        style={{ background: 'var(--brand)', boxShadow: '0 2px 12px rgba(201,75,42,0.25)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            {stage === 'loading'
              ? <Loader2 size={20} color="white" className="animate-spin" />
              : <Camera size={20} color="white" strokeWidth={1.8} />
            }
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-[15px] leading-snug">
              {stage === 'loading' ? 'AI가 식재료를 인식 중...' : '영수증 스캔으로 자동 등록'}
            </p>
            <p className="text-white/70 text-[12px] mt-0.5">
              {stage === 'loading'
                ? 'Gemini AI가 이미지를 분석하고 있어요'
                : '마트 영수증 · 냉장고 사진 → 자동 인식'}
            </p>
          </div>
          {stage !== 'loading' && (
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">AI</span>
          )}
        </div>
      </button>

      {stage === 'error' && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
             style={{ background: 'var(--red-light)', border: '1px solid #F4A9A0' }}>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold" style={{ color: 'var(--red)' }}>인식 실패: {errMsg}</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--red)' }}>식재료가 잘 보이는 사진으로 다시 시도해 보세요.</p>
          </div>
          <button onClick={() => setStage('idle')} className="shrink-0 touch-manipulation">
            <X size={16} color="var(--red)" />
          </button>
        </div>
      )}

      {stage === 'review' && (
        <OcrReviewModal items={extracted} onConfirm={handleConfirm} onClose={() => setStage('idle')} />
      )}
    </>
  );
}
