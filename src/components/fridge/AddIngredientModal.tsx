'use client';
import { useState, useEffect } from 'react';
import type { FridgeItem } from '@/types';
import { UNITS } from '@/constants/taste';
import { expireDateFromDays } from '@/utils/expiry';
import { t, isEn } from '@/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<FridgeItem, 'ingredient_id' | 'registered_at'>) => void;
  editItem?: FridgeItem;
  onEdit?: (item: FridgeItem) => void;
}

const QUICK_ITEMS_KO = [
  { name: '감자',   icon: '🥔', unit: '개' },
  { name: '당근',   icon: '🥕', unit: '개' },
  { name: '애호박', icon: '🫑', unit: '개' },
  { name: '버섯',   icon: '🍄', unit: 'g' },
  { name: '고기',   icon: '🥩', unit: 'g' },
  { name: '두부',   icon: '⬜', unit: '개' },
];

const QUICK_ITEMS_EN = [
  { name: 'Potato',   icon: '🥔', unit: 'pcs' },
  { name: 'Carrot',   icon: '🥕', unit: 'pcs' },
  { name: 'Zucchini', icon: '🫑', unit: 'pcs' },
  { name: 'Mushroom', icon: '🍄', unit: 'g' },
  { name: 'Meat',     icon: '🥩', unit: 'g' },
  { name: 'Tofu',     icon: '⬜', unit: 'block' },
];

const QUICK_ITEMS = isEn ? QUICK_ITEMS_EN : QUICK_ITEMS_KO;

export function AddIngredientModal({ isOpen, onClose, onAdd, editItem, onEdit }: Props) {
  const isEditMode = Boolean(editItem);

  const [name, setName]             = useState('');
  const [icon, setIcon]             = useState('🥕');
  const [amount, setAmount]         = useState('');
  const [unit, setUnit]             = useState('g');
  const [expireDays, setExpireDays] = useState('7');
  const [errors, setErrors]         = useState<Record<string, string>>({});

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setIcon(editItem.icon);
      setAmount(String(editItem.amount));
      setUnit(editItem.unit);
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
    if (!name.trim()) errs.name = t.fridge.errName;
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = t.fridge.errAmount;
    const days = parseInt(expireDays);
    if (!expireDays || isNaN(days) || days < 0) errs.expire = t.fridge.errExpiry;
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
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 space-y-4 shadow-xl"
           style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px) + 60px)' }}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-3" />
        <h2 className="text-lg font-bold text-gray-900">
          {isEditMode ? t.fridge.addTitleEdit : t.fridge.addTitleAdd}
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
              placeholder={t.fridge.namePlaceholder}
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
              placeholder={t.fridge.amountPlaceholder}
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
          <label className="text-sm text-gray-600 shrink-0">{t.fridge.expiryLabel}</label>
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
          <span className="text-sm text-gray-500">{t.fridge.expiryDaysSuffix}</span>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-lg touch-manipulation"
        >
          {isEditMode ? t.fridge.saveEdit : t.fridge.saveAdd}
        </button>
      </div>
    </div>
  );
}
