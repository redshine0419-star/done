'use client';
import { useState } from 'react';
import { expireDateFromDays } from '@/utils/expiry';
import type { FridgeItem } from '@/types';

interface ExtractedItem {
  name: string;
  icon: string;
  amount: number;
  unit: string;
}

interface Props {
  items: ExtractedItem[];
  onConfirm: (items: Omit<FridgeItem, 'ingredient_id' | 'registered_at'>[]) => void;
  onClose: () => void;
}

export function OcrReviewModal({ items: initial, onConfirm, onClose }: Props) {
  const [items, setItems] = useState(initial.map(i => ({ ...i, expireDays: '7' })));

  function remove(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: string, value: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function handleConfirm() {
    const toAdd = items
      .filter(i => i.name.trim())
      .map(i => ({
        name: i.name.trim(),
        icon: i.icon || '🥕',
        amount: parseFloat(i.amount as unknown as string) || 1,
        unit: i.unit,
        expire_date: expireDateFromDays(parseInt(i.expireDays) || 7),
      }));
    onConfirm(toAdd);
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full bg-white rounded-t-3xl p-6 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-bold text-gray-800">식재료를 찾지 못했어요</p>
          <p className="text-sm text-gray-400 mt-1">영수증이나 식재료가 잘 보이는 사진을 다시 시도해 보세요.</p>
          <button onClick={onClose} className="mt-4 w-full h-12 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold">닫기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="font-black text-gray-900 text-lg">식재료 인식 결과</h2>
          <p className="text-xs text-gray-400 mt-0.5">수정 후 냉장고에 추가하세요</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <input
                value={item.icon}
                onChange={e => update(idx, 'icon', e.target.value)}
                className="w-10 h-10 text-2xl text-center bg-white rounded-lg border border-gray-200 shrink-0"
              />
              <input
                value={item.name}
                onChange={e => update(idx, 'name', e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white min-w-0"
              />
              <input
                type="number"
                value={item.amount}
                min="0.1"
                onChange={e => update(idx, 'amount', e.target.value)}
                className="w-14 h-10 px-2 rounded-lg border border-gray-200 text-sm text-center bg-white"
              />
              <span className="text-xs text-gray-400 shrink-0 w-6">{item.unit}</span>
              <input
                type="number"
                value={item.expireDays}
                min="0"
                onChange={e => update(idx, 'expireDays', e.target.value)}
                title="유통기한(일)"
                className="w-10 h-10 px-1 rounded-lg border border-gray-200 text-xs text-center bg-white"
              />
              <span className="text-xs text-gray-400 shrink-0">일</span>
              <button
                onClick={() => remove(idx)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="px-5 pb-6 pt-3 space-y-2 shrink-0 border-t border-gray-100">
          <button
            onClick={handleConfirm}
            className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation"
          >
            🧊 {items.length}개 냉장고에 추가
          </button>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-semibold touch-manipulation"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
