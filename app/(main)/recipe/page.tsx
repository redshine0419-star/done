'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Heart } from 'lucide-react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { useApp } from '@/context/AppContext';
import { useRecipes } from '@/hooks/useRecipes';
import { getMatchRate } from '@/utils/ingredientMatch';
import { getDaysUntilExpiry } from '@/utils/expiry';
import type { Recipe } from '@/types';

type Filter = 'all' | 'single' | 'combo' | 'baking';

export default function RecipePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { fridgeItems, favoriteIds } = state;
  const allRecipes = useRecipes();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [favOnly, setFavOnly] = useState(false);

  const sorted = useMemo(() => {
    const list = allRecipes
      .filter(r => {
        if (favOnly) return favoriteIds.includes(r.id);
        if (filter === 'all') return true;
        if (filter === 'baking') return r.category === '베이킹';
        if (filter === 'combo') return r.isCombo && r.category !== '베이킹';
        if (filter === 'single') return !r.isCombo && r.category !== '베이킹';
        return true;
      })
      .filter(r => r.title.includes(query) || r.story.includes(query));
    return fridgeItems.length > 0
      ? [...list].sort((a, b) => getMatchRate(b, fridgeItems) - getMatchRate(a, fridgeItems))
      : list;
  }, [allRecipes, fridgeItems, filter, query, favOnly, favoriteIds]);

  const canMakeNow = allRecipes.filter(r => getMatchRate(r, fridgeItems) >= 80).length;

  const expiringItems = fridgeItems.filter(i => {
    const d = getDaysUntilExpiry(i.expire_date);
    return d !== null && d <= 3;
  });
  const expiringRecipes = expiringItems.length > 0
    ? allRecipes.filter(r => r.ingredients.some(ing =>
        expiringItems.some(f => {
          const fn = f.name.replace(/\s+/g, '').toLowerCase();
          const rn = ing.name.replace(/\s+/g, '').toLowerCase();
          return fn === rn || fn.includes(rn) || rn.includes(fn);
        })
      )).slice(0, 3)
    : [];

  function handleStart(recipe: Recipe) {
    dispatch({ type: 'START_COOKING', payload: recipe });
    router.push('/cook');
  }

  const filterBtns: { value: Filter; label: string }[] = [
    { value: 'all',     label: '전체' },
    { value: 'single',  label: '1구 단품' },
    { value: 'combo',   label: '2구 코스 ⚡' },
    { value: 'baking',  label: '🧁 베이킹' },
  ];

  const subtitle = fridgeItems.length > 0
    ? `지금 바로 만들 수 있는 레시피 ${canMakeNow}개`
    : '냉장고 재료를 등록하면 맞춤 추천해 드려요';

  const addButton = (
    <Link href="/recipe/submit"
          className="w-9 h-9 flex items-center justify-center rounded-xl touch-manipulation"
          style={{ background: 'var(--brand-light)' }}>
      <Plus size={18} color="var(--brand)" strokeWidth={2.5} />
    </Link>
  );

  return (
    <ScreenWrapper title="레시피" subtitle={subtitle} action={addButton}>
      <div className="space-y-4">

        {/* Stats row */}
        {fridgeItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xl font-black text-green-600">{canMakeNow}</p>
              <p className="text-xs text-green-700 mt-0.5">바로 가능</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xl font-black text-orange-500">{fridgeItems.length}</p>
              <p className="text-xs text-orange-600 mt-0.5">보유 식재료</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xl font-black text-purple-600">{allRecipes.filter(r => r.isCombo).length}</p>
              <p className="text-xs text-purple-700 mt-0.5">2구 코스</p>
            </div>
          </div>
        )}

        {/* Expiry alert banner */}
        {expiringRecipes.length > 0 && (
          <div className="rounded-2xl p-4 space-y-2"
               style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <p className="text-[13px] font-bold" style={{ color: '#C2410C' }}>
                {expiringItems[0].name} 등 {expiringItems.length}가지 재료 유통기한이 임박했어요
              </p>
            </div>
            <p className="text-[12px]" style={{ color: '#EA580C' }}>이 재료로 만들 수 있는 레시피</p>
            <div className="flex gap-2 flex-wrap">
              {expiringRecipes.map(r => (
                <Link key={r.id} href={`/recipe/${r.id}`}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold touch-manipulation"
                      style={{ background: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA' }}>
                  {r.thumbnail} {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Hero — 2구 병렬 조리 USP (항상 표시) */}
        <div className="rounded-3xl overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #3B1F8C 0%, #6B3FD4 100%)' }}>
          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-2"
                      style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  플레이버 싱크만의 기능
                </span>
                <p className="text-[18px] font-black text-white leading-tight">
                  두 화구를 동시에 써서<br />조리 시간 최대 47% 단축
                </p>
                <p className="text-[12px] mt-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  메인 요리 + 국물을 함께 완성하는 2구 병렬 조리
                </p>
              </div>
              <span className="text-4xl shrink-0">⚡</span>
            </div>
            <button
              onClick={() => setFilter('combo')}
              className="mt-3 px-4 py-2 rounded-xl text-[13px] font-bold touch-manipulation"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              2구 코스 레시피 보기 →
            </button>
          </div>
        </div>

        {fridgeItems.length === 0 && (
          <div className="rounded-2xl p-4 flex gap-3 items-center"
               style={{ background: 'var(--brand-light)', border: '1px solid rgba(201,75,42,0.2)' }}>
            <span className="text-2xl shrink-0">🧊</span>
            <div className="flex-1">
              <p className="text-[13px] font-bold" style={{ color: 'var(--brand)' }}>
                냉장고 재료를 등록하면 지금 만들 수 있는 레시피를 알려드려요
              </p>
            </div>
            <button
              onClick={() => router.push('/fridge')}
              className="shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold touch-manipulation"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              등록하기
            </button>
          </div>
        )}

        {/* Search + 즐겨찾기 토글 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} color="var(--text-3)" className="absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={favOnly ? '즐겨찾기에서 검색' : '레시피 검색'}
              className="w-full h-12 pl-10 pr-4 rounded-2xl text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)' }}
            />
          </div>
          <button
            onClick={() => setFavOnly(v => !v)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl shrink-0 touch-manipulation"
            style={{
              background: favOnly ? '#FEF2F2' : 'var(--surface)',
              border: `1px solid ${favOnly ? '#FCA5A5' : 'var(--border)'}`,
            }}
            aria-label="즐겨찾기만 보기"
          >
            <Heart size={18} strokeWidth={2} color={favOnly ? '#EF4444' : 'var(--text-3)'} fill={favOnly ? '#EF4444' : 'none'} />
          </button>
        </div>

        {/* Filter chips (즐겨찾기 모드일 때 숨김) */}
        {!favOnly && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {filterBtns.map(btn => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold touch-manipulation transition-colors"
                style={{
                  background: filter === btn.value ? 'var(--brand)' : 'var(--surface)',
                  color: filter === btn.value ? 'white' : 'var(--text-2)',
                  border: `1px solid ${filter === btn.value ? 'var(--brand)' : 'var(--border)'}`,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {fridgeItems.length > 0 && (
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            보유 재료 많은 순
          </p>
        )}

        {/* Recipe grid: 1 col mobile, 2 col md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              fridgeItems={fridgeItems}
              onStart={handleStart}
            />
          ))}
        </div>

        {sorted.length === 0 && favOnly && !query && (
          <div className="text-center py-12" style={{ color: 'var(--text-3)' }}>
            <p className="text-4xl mb-2">🤍</p>
            <p className="text-sm">즐겨찾기한 레시피가 없어요</p>
            <p className="text-xs mt-1">레시피 카드의 하트를 눌러 추가하세요</p>
          </div>
        )}

        {sorted.length === 0 && (!favOnly || query) && (
          <div className="text-center py-12" style={{ color: 'var(--text-3)' }}>
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">검색 결과가 없어요</p>
            <button
              onClick={() => { setQuery(''); setFilter('all'); setFavOnly(false); }}
              className="mt-3 text-xs font-semibold"
              style={{ color: 'var(--brand)' }}
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
}
