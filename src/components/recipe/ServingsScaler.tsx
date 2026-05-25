'use client';
import { useState } from 'react';
import type { RecipeIngredient } from '@/types';

interface Props {
  baseServings: number;
  ingredients: RecipeIngredient[];
}

function formatAmount(val: number): string {
  if (val === Math.floor(val)) return String(val);
  return val.toFixed(1).replace(/\.0$/, '');
}

export function ServingsScaler({ baseServings, ingredients }: Props) {
  const [servings, setServings] = useState(baseServings);
  const ratio = servings / baseServings;

  const mainIngredients = ingredients.filter(i => i.type === 'main');
  const seasonings = ingredients.filter(i => i.type === 'seasoning');

  return (
    <div className="space-y-4">
      {/* Servings control */}
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
           style={{ background: 'var(--brand-light)', border: '1px solid rgba(201,75,42,0.15)' }}>
        <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text-2)' }}>인분 조절</span>
        <button
          onClick={() => setServings(s => Math.max(1, s - 1))}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg touch-manipulation"
          style={{ background: 'var(--surface)', color: 'var(--brand)', border: '1px solid var(--brand-mid)' }}
        >
          −
        </button>
        <span className="w-16 text-center font-black text-[18px]" style={{ color: 'var(--brand)' }}>
          {servings}인분
        </span>
        <button
          onClick={() => setServings(s => Math.min(10, s + 1))}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg touch-manipulation"
          style={{ background: 'var(--surface)', color: 'var(--brand)', border: '1px solid var(--brand-mid)' }}
        >
          +
        </button>
      </div>

      {/* Main ingredients */}
      <section>
        <h2 className="text-[17px] font-black mb-3" style={{ color: 'var(--text-1)' }}>주재료</h2>
        <div className="grid grid-cols-2 gap-2">
          {mainIngredients.map(ing => (
            <div key={ing.ingredient_id}
                 className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                 style={{ background: 'var(--brand-light)', border: '1px solid rgba(201,75,42,0.12)' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--brand)' }} />
              <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                {ing.name}
              </span>
              <span className="text-[12px] ml-auto shrink-0 font-medium" style={{ color: ratio !== 1 ? 'var(--brand)' : 'var(--text-3)' }}>
                {formatAmount(ing.base_amount * ratio)}{ing.unit}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Seasonings */}
      {seasonings.length > 0 && (
        <section>
          <h2 className="text-[17px] font-black mb-3" style={{ color: 'var(--text-1)' }}>양념</h2>
          <div className="flex flex-wrap gap-2">
            {seasonings.map(ing => (
              <span key={ing.ingredient_id}
                    className="text-[12px] px-3 py-1.5 rounded-full font-medium"
                    style={{ background: 'var(--surface)', color: ratio !== 1 ? 'var(--brand)' : 'var(--text-2)', border: `1px solid ${ratio !== 1 ? 'var(--brand-mid)' : 'var(--border)'}` }}>
                {ing.name} {formatAmount(ing.base_amount * ratio)}{ing.unit}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
