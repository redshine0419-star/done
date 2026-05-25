'use client';
import { useState, useEffect } from 'react';
import type { FridgeItem } from '@/types';
import { UNITS } from '@/constants/taste';
import { expireDateFromDays } from '@/utils/expiry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<FridgeItem, 'ingredient_id' | 'registered_at'>) => void;
  editItem?: FridgeItem;
  onEdit?: (item: FridgeItem) => void;
}

const QUICK_ITEMS = [
  { name: '감자',   icon: '🥔', unit: '개' },
  { name: '당근',   icon: '🥕', unit: '개' },
  { name: '애호박', icon: '🫑', unit: '개' },
  { name: '버섯',   icon: '🍄', unit: 'g' },
  { name: '고기',   icon: '🥩', unit: 'g' },
  { name: '두부',   icon: '⬜', unit: '개' },
];

export function AddIngredientModal({ isOpen, onClose, onAdd, editItem, onEdit }: Props) {
  const isEditMode = Boolean(editItem);

  const [name, setName]             = useState('');
  const [icon, setIcon]             = useState('🥕');
  const [amount, setAmount]         = useState('');
  const [unit, setUnit]             = useState('g');
  const [expireDays, setExpireDays] = useState('7');
  const [errors, setErrors]         = useState<Record<string, string>>({});

  // 수정 모드 진입 시 기존 값 채우기
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setIcon(editItem.icon);
      setAmount(String(editItem.amount));
      setUnit(editItem.unit);
      // expire_date → 남은 일수
      const diff = Math.ceil(
        (new Date(editItem.expire_date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000
      );
      setExpireDays(String(Math.max(1, diff)));
    } else {
      setName(''); setAmount(''); setUnit('g'); setExpireDays('7'); setIcon('🥕');
    }
    setErrors({});
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '이름을 입력하세요';
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = '0보다 큰 수량을 입력하세요';
    const days = parseInt(expireDays);
    if (!expireDays || isNaN(days) || days < 0) errs.expire = '0 이상의 숫자를 입력하세요';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const base = {
      name: name.trim(),
      icon,
      amount: parseFloat(amount),
      unit,
      expire_date: expireDateFromDays(parseInt(expireDays) || 0),
    };

    if (isEditMode && editItem && onEdit) {
      onEdit({ ...editItem, ...base });
    } else {
      onAdd(base);
    }
    onClose();
  }

  function applyQuick(q: typeof QUICK_ITEMS[0]) {
    setName(q.name); setIcon(q.icon); setUnit(q.unit);
    setErrors(prev => ({ ...prev, name: '' }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 space-y-4 shadow-xl">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-3" />
        <h2 className="text-lg font-bold text-gray-900">
          {isEditMode ? '식재료 수정' : '식재료 추가'}
        </h2>

        {!isEditMode && (
          <div className="flex gap-2 flex-wrap">
            {QUICK_ITEMS.map(q => (
              <button
                key={q.name}
                onClick={() => applyQuick(q)}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-orange-50 border border-orange-200 text-sm font-medium text-orange-700 touch-manipulation"
              >
                {q.icon} {q.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="w-14 h-14 text-3xl text-center rounded-xl border border-gray-200 bg-gray-50"
          />
          <div className="flex-1">
            <input
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              placeholder="식재료 이름"
              className={`w-full h-14 px-4 rounded-xl border text-base ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={amount}
              min="0.1"
              step="0.1"
              onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: '' })); }}
              placeholder="수량"
              className={`w-full h-14 px-4 rounded-xl border text-base ${errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1 ml-1">{errors.amount}</p>}
          </div>
          <div className="flex gap-1">
            {UNITS.slice(0, 4).map(u => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`h-14 px-3 rounded-xl text-sm font-semibold border touch-manipulation ${
                  unit === u ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 shrink-0">유통기한</label>
          <div className="flex-1">
            <input
              type="number"
              value={expireDays}
              min="0"
              onChange={e => { setExpireDays(e.target.value); setErrors(p => ({ ...p, expire: '' })); }}
              className={`w-full h-12 px-4 rounded-xl border text-base ${errors.expire ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            />
            {errors.expire && <p className="text-xs text-red-500 mt-1 ml-1">{errors.expire}</p>}
          </div>
          <span className="text-sm text-gray-500">일 후 만료</span>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-lg touch-manipulation"
        >
          {isEditMode ? '수정 완료' : '냉장고에 추가'}
        </button>
      </div>
    </div>
  );
}
