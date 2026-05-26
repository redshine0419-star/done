'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, Users, Zap, Check, X, ExternalLink } from 'lucide-react';
import type { Recipe, FridgeItem } from '@/types';
import { ingredientMatches } from '@/utils/ingredientMatch';

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
  const have = mains.filter(ing => fridgeItems.some(f => ingredientMatches(f, ing)));
  const rate = mains.length === 0 ? 100 : Math.round((have.length / mains.length) * 100);
  return { rate, have: have.length, total: mains.length };
}

function MatchRing({ rate }: { rate: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const color = rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--amber)' : 'var(--text-3)';
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${(rate / 100) * circ} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color }}>
        {rate}%
      </span>
    </div>
  );
}

export function RecipeCard({ recipe, fridgeItems, onStart }: Props) {
  const [open, setOpen] = useState(false);
  const { parallel, sequential, savings } = getTimings(recipe);
  const match = getMatchInfo(recipe, fridgeItems);

  return (
    <div className="rounded-2xl overflow-hidden bg-surface" style={{ border: '1px solid var(--border)' }}>
      {/* Header row */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 touch-manipulation"
        onClick={() => setOpen(v => !v)}
      >
        <MatchRing rate={match.rate} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {match.rate >= 80 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
                <Check size={10} strokeWidth={3} /> 바로 가능
              </span>
            )}
            {match.rate >= 50 && match.rate < 80 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
                재료 {match.total - match.have}개 부족
              </span>
            )}
            {match.rate < 50 && match.total > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg)', color: 'var(--text-3)' }}>
                {match.have}/{match.total}개 보유
              </span>
            )}
            {recipe.isCombo && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#F0ECFF', color: '#6B3FD4' }}>
                <Zap size={10} strokeWidth={2.5} /> 2구
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[15px] truncate" style={{ color: 'var(--text-1)' }}>
              {recipe.title}
            </h3>
            <Link
              href={`/recipe/${recipe.id}`}
              onClick={e => e.stopPropagation()}
              className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-semibold touch-manipulation"
              style={{ color: 'var(--brand)' }}
            >
              상세 <ExternalLink size={10} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: 'var(--text-3)' }}>
              <Clock size={11} strokeWidth={2} />{Math.round(parallel / 60)}분
            </span>
            <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: 'var(--text-3)' }}>
              <Users size={11} strokeWidth={2} />{recipe.servings}인분
            </span>
          </div>
        </div>

        <ChevronDown
          size={18} strokeWidth={2} color="var(--text-3)"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded panel */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {recipe.isCombo && savings > 60 && (
            <div className="mx-4 mt-4 rounded-xl p-3" style={{ background: '#F5F2FF', border: '1px solid #D9CFFF' }}>
              <p className="text-[12px] font-bold mb-2.5" style={{ color: '#6B3FD4' }}>
                <Zap size={12} className="inline mr-1" strokeWidth={2.5} />
                2구 병렬 시간 분석
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: '1구 순차', value: `${Math.round(sequential / 60)}분`, color: 'var(--text-2)' },
                  { label: '2구 병렬', value: `${Math.round(parallel / 60)}분`, color: '#6B3FD4' },
                  { label: '절약', value: `-${Math.round(savings / 60)}분`, color: 'var(--green)' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{label}</p>
                    <p className="font-black text-[14px] mt-0.5" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pt-4">
            <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-3)' }}>주재료</p>
            <div className="space-y-1.5">
              {recipe.ingredients.filter(i => i.type === 'main').map(ing => {
                const owned = fridgeItems.some(f => ingredientMatches(f, ing));
                return (
                  <div key={ing.ingredient_id} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: owned ? 'var(--green)' : 'var(--border)' }}>
                      {owned
                        ? <Check size={11} color="white" strokeWidth={3} />
                        : <X size={10} color="var(--text-3)" strokeWidth={2.5} />}
                    </div>
                    <span className="text-[13px]" style={{ color: owned ? 'var(--text-1)' : 'var(--text-3)' }}>
                      {ing.name}
                    </span>
                    <span className="ml-auto text-[12px]" style={{ color: 'var(--text-3)' }}>
                      {ing.base_amount}{ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-4 pt-4">
            <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--text-3)' }}>조리 순서</p>
            <div className="space-y-1.5">
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                       style={{
                         background: step.burner === 1 ? 'var(--brand-light)' : step.burner === 2 ? '#EBF2FF' : 'var(--bg)',
                         color: step.burner === 1 ? 'var(--brand)' : step.burner === 2 ? '#2563EB' : 'var(--text-2)',
                       }}>
                    {step.burner ?? '·'}
                  </div>
                  <span className="flex-1 text-[13px]" style={{ color: 'var(--text-2)' }}>{step.action}</span>
                  <span className="text-[12px] shrink-0" style={{ color: 'var(--text-3)' }}>
                    {Math.round(step.duration_sec / 60)}분
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-4">
            <button
              onClick={() => onStart(recipe)}
              className="w-full h-[52px] rounded-2xl font-bold text-[15px] touch-manipulation"
              style={{ background: 'var(--brand)', color: 'white', boxShadow: '0 2px 12px rgba(201,75,42,0.3)' }}
            >
              {recipe.isCombo ? '2구 코스 조리 시작' : '조리 시작'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
