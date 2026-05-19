import { useState } from 'react';
import type { Recipe } from '@/types';

interface Props {
  recipe: Recipe;
  onStart: (recipe: Recipe) => void;
}

function getTimings(recipe: Recipe) {
  const b1 = recipe.steps.filter(s => s.burner === 1).reduce((a, s) => a + s.duration_sec, 0);
  const b2 = recipe.steps.filter(s => s.burner === 2).reduce((a, s) => a + s.duration_sec, 0);
  const sequential = b1 + b2;
  const parallel = Math.max(b1, b2);
  return { b1, b2, sequential, parallel, savings: sequential - parallel };
}

export function RecipeCard({ recipe, onStart }: Props) {
  const [open, setOpen] = useState(false);
  const { sequential, parallel, savings } = getTimings(recipe);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <span className="text-5xl">{recipe.thumbnail}</span>
        <div className="flex-1">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {recipe.isCombo && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">2구 병렬</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
              {Math.round(parallel / 60)}분 완성
            </span>
            {savings > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                약 {Math.round(savings / 60)}분 절약 ⚡
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900">{recipe.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{recipe.servings}인분 · 재료 {recipe.ingredients.length}가지</p>
        </div>
        <span className={`text-gray-400 text-xl transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {recipe.isCombo && (
            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-3">
              <p className="text-xs font-bold text-purple-700 mb-1">⏱ 2구 병렬 시간 분석</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-gray-500">1구 순차</p><p className="font-black text-gray-800">{Math.round(sequential / 60)}분</p></div>
                <div><p className="text-gray-500">2구 병렬</p><p className="font-black text-purple-700">{Math.round(parallel / 60)}분</p></div>
                <div><p className="text-gray-500">시간 절약</p><p className="font-black text-green-600">-{Math.round(savings / 60)}분</p></div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.burner === 1 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {step.burner}
                </span>
                <span className="flex-1 text-gray-700">{step.action}</span>
                <span className="text-gray-400 text-xs shrink-0">{Math.round(step.duration_sec / 60)}분</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onStart(recipe)}
            className="w-full h-14 rounded-2xl bg-[#FF6B35] text-white font-bold text-base touch-manipulation shadow-md"
          >
            {recipe.isCombo ? '🍳 2구 코스 조리 시작' : '🔥 1구 조리 시작'}
          </button>
        </div>
      )}
    </div>
  );
}
