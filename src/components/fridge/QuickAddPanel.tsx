'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { t, isEn } from '@/i18n';

type QuickItem = { emoji: string; name: string; unit: string; amount: number; category: string };

const QUICK_ITEMS_KO: QuickItem[] = [
  { emoji: '🥩', name: '돼지고기', unit: 'g',  amount: 300, category: 'meat' },
  { emoji: '🍗', name: '닭고기',   unit: 'g',  amount: 300, category: 'meat' },
  { emoji: '🥓', name: '베이컨',   unit: '줄', amount: 5,   category: 'meat' },
  { emoji: '🫙', name: '참치캔',   unit: '개', amount: 1,   category: 'meat' },
  { emoji: '🧅', name: '양파',     unit: '개', amount: 2,   category: 'veg' },
  { emoji: '🌿', name: '대파',     unit: '대', amount: 1,   category: 'veg' },
  { emoji: '🧄', name: '마늘',     unit: '통', amount: 1,   category: 'veg' },
  { emoji: '🥬', name: '배추',     unit: 'g',  amount: 200, category: 'veg' },
  { emoji: '🥔', name: '감자',     unit: '개', amount: 3,   category: 'veg' },
  { emoji: '🥕', name: '당근',     unit: '개', amount: 1,   category: 'veg' },
  { emoji: '🍄', name: '버섯',     unit: 'g',  amount: 100, category: 'veg' },
  { emoji: '🌶️', name: '고추',    unit: '개', amount: 5,   category: 'veg' },
  { emoji: '🥚', name: '달걀',     unit: '개', amount: 6,   category: 'basic' },
  { emoji: '🧈', name: '두부',     unit: '모', amount: 1,   category: 'basic' },
  { emoji: '🍚', name: '밥',       unit: '공기', amount: 2, category: 'basic' },
  { emoji: '🍜', name: '라면',     unit: '개', amount: 3,   category: 'basic' },
  { emoji: '🫙', name: '김치',     unit: 'g',  amount: 300, category: 'basic' },
  { emoji: '🧃', name: '두유',     unit: '팩', amount: 1,   category: 'basic' },
];

const QUICK_ITEMS_EN: QuickItem[] = [
  { emoji: '🥩', name: 'Pork',         unit: 'g',      amount: 300, category: 'meat' },
  { emoji: '🍗', name: 'Chicken',      unit: 'g',      amount: 300, category: 'meat' },
  { emoji: '🥓', name: 'Bacon',        unit: 'strips', amount: 5,   category: 'meat' },
  { emoji: '🫙', name: 'Canned tuna',  unit: 'can',    amount: 1,   category: 'meat' },
  { emoji: '🧅', name: 'Onion',        unit: 'pcs',    amount: 2,   category: 'veg' },
  { emoji: '🌿', name: 'Green onion',  unit: 'stalks', amount: 1,   category: 'veg' },
  { emoji: '🧄', name: 'Garlic',       unit: 'bulb',   amount: 1,   category: 'veg' },
  { emoji: '🥬', name: 'Cabbage',      unit: 'g',      amount: 200, category: 'veg' },
  { emoji: '🥔', name: 'Potato',       unit: 'pcs',    amount: 3,   category: 'veg' },
  { emoji: '🥕', name: 'Carrot',       unit: 'pcs',    amount: 1,   category: 'veg' },
  { emoji: '🍄', name: 'Mushroom',     unit: 'g',      amount: 100, category: 'veg' },
  { emoji: '🌶️', name: 'Chili pepper', unit: 'pcs',   amount: 5,   category: 'veg' },
  { emoji: '🥚', name: 'Egg',          unit: 'pcs',    amount: 6,   category: 'basic' },
  { emoji: '🧈', name: 'Tofu',         unit: 'block',  amount: 1,   category: 'basic' },
  { emoji: '🍚', name: 'Rice',         unit: 'bowls',  amount: 2,   category: 'basic' },
  { emoji: '🍜', name: 'Ramen',        unit: 'packs',  amount: 3,   category: 'basic' },
  { emoji: '🫙', name: 'Kimchi',       unit: 'g',      amount: 300, category: 'basic' },
  { emoji: '🧃', name: 'Soy milk',     unit: 'carton', amount: 1,   category: 'basic' },
];

const QUICK_ITEMS = isEn ? QUICK_ITEMS_EN : QUICK_ITEMS_KO;

const CATEGORIES = [
  { key: 'meat',  label: () => t.fridge.quickCatMeat },
  { key: 'veg',   label: () => t.fridge.quickCatVeg },
  { key: 'basic', label: () => t.fridge.quickCatBasic },
];

export function QuickAddPanel({ onDone }: { onDone: () => void }) {
  const { dispatch } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleAdd() {
    if (selected.size === 0) { onDone(); return; }
    QUICK_ITEMS.filter(i => selected.has(i.name)).forEach(item => {
      dispatch({
        type: 'ADD_FRIDGE_ITEM',
        payload: {
          ingredient_id: `u_${Date.now()}_${item.name}`,
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          icon: item.emoji,
          expire_date: '',
          registered_at: new Date().toISOString(),
        },
      });
    });
    onDone();
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-[17px] font-black" style={{ color: 'var(--text-1)' }}>{t.fridge.quickTitle}</p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-3)' }}>{t.fridge.quickHint}</p>
      </div>

      {CATEGORIES.map(cat => (
        <div key={cat.key}>
          <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-3)' }}>{cat.label()}</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ITEMS.filter(i => i.category === cat.key).map(item => {
              const on = selected.has(item.name);
              return (
                <button
                  key={item.name}
                  onClick={() => toggle(item.name)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[13px] font-semibold touch-manipulation transition-all"
                  style={{
                    background: on ? 'var(--brand)' : 'var(--surface)',
                    color: on ? 'white' : 'var(--text-2)',
                    border: `1.5px solid ${on ? 'var(--brand)' : 'var(--border)'}`,
                  }}
                >
                  {item.emoji} {item.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleAdd}
        className="w-full h-12 rounded-2xl font-bold text-[15px] touch-manipulation"
        style={{ background: selected.size > 0 ? 'var(--brand)' : 'var(--surface)', color: selected.size > 0 ? 'white' : 'var(--text-3)', border: selected.size > 0 ? 'none' : '1.5px solid var(--border)' }}
      >
        {selected.size > 0
          ? t.fridge.quickAddBtn.replace('{count}', String(selected.size))
          : t.fridge.quickSkip}
      </button>
    </div>
  );
}
