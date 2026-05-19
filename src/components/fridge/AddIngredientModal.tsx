import { useState } from 'react';
import type { FridgeItem } from '@/types';
import { UNITS } from '@/constants/taste';
import { expireDateFromDays } from '@/utils/expiry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<FridgeItem, 'ingredient_id' | 'registered_at'>) => void;
}

const QUICK_ITEMS = [
  { name: '감자', icon: '🥔', unit: '개' },
  { name: '당근', icon: '🥕', unit: '개' },
  { name: '애호박', icon: '🫑', unit: '개' },
  { name: '버섯', icon: '🍄', unit: 'g' },
  { name: '고기', icon: '🥩', unit: 'g' },
  { name: '두부', icon: '⬜', unit: '개' },
];

export function AddIngredientModal({ isOpen, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🥕');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('g');
  const [expireDays, setExpireDays] = useState('7');

  if (!isOpen) return null;

  function handleSubmit() {
    if (!name.trim() || !amount) return;
    onAdd({
      name: name.trim(),
      icon,
      amount: parseFloat(amount),
      unit,
      expire_date: expireDateFromDays(parseInt(expireDays) || 7),
    });
    setName(''); setAmount(''); setUnit('g'); setExpireDays('7'); setIcon('🥕');
    onClose();
  }

  function applyQuick(q: typeof QUICK_ITEMS[0]) {
    setName(q.name); setIcon(q.icon); setUnit(q.unit);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 space-y-4 shadow-xl">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-3" />
        <h2 className="text-lg font-bold text-gray-900">식재료 추가</h2>

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

        <div className="flex gap-2 items-center">
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="w-14 h-14 text-3xl text-center rounded-xl border border-gray-200 bg-gray-50"
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="식재료 이름"
            className="flex-1 h-14 px-4 rounded-xl border border-gray-200 text-base"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="수량"
            className="flex-1 h-14 px-4 rounded-xl border border-gray-200 text-base"
          />
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
          <input
            type="number"
            value={expireDays}
            onChange={e => setExpireDays(e.target.value)}
            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 text-base"
          />
          <span className="text-sm text-gray-500">일 후 만료</span>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-lg touch-manipulation"
        >
          냉장고에 추가
        </button>
      </div>
    </div>
  );
}
