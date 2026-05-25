'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Recipe, FridgeItem } from '@/types';

interface Props {
  recipe: Recipe;
  fridgeItems: FridgeItem[];
  onStart: (recipe: Recipe) => void;
}

function getTimings(recipe: Recipe) {
  const b1 = recipe.steps.filter(s => s.burner === 1).reduce((a, s) => a + s.duration_sec, 0);
  const b2 = recipe.steps.filter(s => s.burner === 2).reduce((a, s) => a + s.duration_sec, 0);
  const sequential = b1 + b2;
  const parallel = Math.max(b1, b2 || 0);
  return { sequential, parallel, savings: sequential - parallel };
}

function getMatchInfo(recipe: Recipe, fridgeItems: FridgeItem[]) {
  const mains = recipe.ingredients.filter(i => i.type === 'main');
  const have = mains.filter(ing => fridgeItems.some(f => f.ingredient_id === ing.ingredient_id));
  const rate = mains.length === 0 ? 100 : Math.round((have.length / mains.length) * 100);
  return { rate, have: have.length, total: mains.length };
}

function MatchBadge({ rate, have, total }: { rate: number; have: number; total: number }) {
  if (rate >= 80) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
        ✓ 바로 가능
      </span>
    );
  }
  if (rate >= 50) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
        재료 {total - have}개 부족
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
      재료 {have}/{total}개 보유
    </span>
  );
}

export function RecipeCard({ recipe, fridgeItems, onStart }: Props) {
  const [open, setOpen] = useState(false);
  const { sequential, parallel, savings } = getTimings(recipe);
  const match = getMatchInfo(recipe, fridgeItems);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setOpen(v => !v)}>
        {/* 매칭율 원형 게이지 */}
        <div className="relative shrink-0 w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={match.rate >= 80 ? '#22c55e' : match.rate >= 50 ? '#eab308' : '#d1d5db'}
              strokeWidth="3"
              strokeDasharray={`${match.rate} ${100 - match.rate}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700">
            {match.rate}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1">
            <MatchBadge {...match} />
            {recipe.isCombo && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">⚡ 2구</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
              {Math.round(parallel / 60)}분
            </span>
          </div>
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-gray-900 text-sm truncate">{recipe.title}</h3>
            <Link
              href={`/recipe/${recipe.id}`}
              onClick={e => e.stopPropagation()}
              className="text-[10px] text-orange-400 shrink-0 hover:underline"
            >
              상세 ›
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{recipe.servings}인분</p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-2xl">{recipe.thumbnail}</span>
          <span className={`text-gray-400 text-xl transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {recipe.isCombo && savings > 60 && (
            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-3">
              <p className="text-xs font-bold text-purple-700 mb-1">⏱ 2구 병렬 시간 분석</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-gray-500">1구 순차</p><p className="font-black text-gray-800">{Math.round(sequential / 60)}분</p></div>
                <div><p className="text-gray-500">2구 병렬</p><p className="font-black text-purple-700">{Math.round(parallel / 60)}분</p></div>
                <div><p className="text-gray-500">절약</p><p className="font-black text-green-600">-{Math.round(savings / 60)}분</p></div>
              </div>
            </div>
          )}

          {/* 재료 보유 현황 */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">주재료 보유 현황</p>
            <div className="space-y-1">
              {recipe.ingredients.filter(i => i.type === 'main').map(ing => {
                const owned = fridgeItems.some(f => f.ingredient_id === ing.ingredient_id);
                return (
                  <div key={ing.ingredient_id} className="flex items-center gap-2 text-xs">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 ${owned ? 'bg-green-400' : 'bg-gray-200'}`}>
                      {owned ? '✓' : '✕'}
                    </span>
                    <span className={owned ? 'text-gray-700' : 'text-gray-400'}>
                      {ing.name} {ing.base_amount}{ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 조리 단계 */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-gray-500">조리 단계</p>
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.burner === 1 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {step.burner}
                </span>
                <span className="flex-1 text-gray-700 text-xs">{step.action}</span>
                <span className="text-gray-400 text-xs shrink-0">{Math.round(step.duration_sec / 60)}분</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onStart(recipe)}
            className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation shadow-md"
          >
            {recipe.isCombo ? '🍳 2구 코스 조리 시작' : '🔥 조리 시작'}
          </button>
        </div>
      )}
    </div>
  );
}
