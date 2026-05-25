import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mockRecipes } from '@/data/mockRecipes';
import { StartCookingButton } from './StartCookingButton';

type Params = { id: string };

export function generateStaticParams() {
  return mockRecipes.map(r => ({ id: r.id }));
}

function getTotalMinutes(recipe: (typeof mockRecipes)[0]) {
  const b1 = recipe.steps.filter(s => s.burner === 1).reduce((a, s) => a + s.duration_sec, 0);
  const b2 = recipe.steps.filter(s => s.burner === 2).reduce((a, s) => a + s.duration_sec, 0);
  return Math.round(Math.max(b1, b2 || 0) / 60);
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { id } = await params;
  const recipe = mockRecipes.find(r => r.id === id);
  if (!recipe) return { title: '레시피를 찾을 수 없어요' };

  const minutes = getTotalMinutes(recipe);
  const mainIngredients = recipe.ingredients
    .filter(i => i.type === 'main')
    .map(i => i.name)
    .join(', ');

  return {
    title: `${recipe.title} 레시피 — 플레이버 싱크`,
    description: `${recipe.story} 주재료: ${mainIngredients}. 조리시간 ${minutes}분, ${recipe.servings}인분.`,
    openGraph: {
      title: `${recipe.title} 레시피`,
      description: recipe.story,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${recipe.title} 레시피`,
      description: recipe.story,
    },
  };
}

export default async function RecipeDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const recipe = mockRecipes.find(r => r.id === id);
  if (!recipe) notFound();

  const b1Steps = recipe.steps.filter(s => s.burner === 1);
  const b2Steps = recipe.steps.filter(s => s.burner === 2);
  const b1Total = b1Steps.reduce((a, s) => a + s.duration_sec, 0);
  const b2Total = b2Steps.reduce((a, s) => a + s.duration_sec, 0);
  const parallelMin = Math.round(Math.max(b1Total, b2Total || 0) / 60);
  const sequentialMin = Math.round((b1Total + b2Total) / 60);

  const mainIngredients = recipe.ingredients.filter(i => i.type === 'main');
  const seasonings = recipe.ingredients.filter(i => i.type === 'seasoning');

  // Schema.org Recipe 구조화 데이터
  const schemaOrg = {
    '@context': 'https://schema.org/',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.story,
    author: { '@type': 'Organization', name: '플레이버 싱크' },
    totalTime: `PT${parallelMin}M`,
    recipeYield: `${recipe.servings}인분`,
    recipeCategory: recipe.isCombo ? '2구 병렬 코스 요리' : '한식',
    recipeCuisine: '한국',
    recipeIngredient: recipe.ingredients.map(
      i => `${i.name} ${i.base_amount}${i.unit}`
    ),
    recipeInstructions: recipe.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.action,
      text: step.description,
    })),
    keywords: [recipe.title, '레시피', '만들기', '집밥', ...recipe.ingredients.map(i => i.name)].join(', '),
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-dvh">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/recipe" className="text-gray-500 p-1 -ml-1 rounded-lg hover:bg-gray-100 text-sm">
          ← 레시피
        </Link>
        {recipe.isCombo && (
          <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            ⚡ 2구 코스
          </span>
        )}
      </header>

      <article className="px-5 py-5 space-y-5">
        {/* Hero */}
        <div className="text-center py-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
          <span className="text-6xl">{recipe.thumbnail}</span>
          <h1 className="text-xl font-black text-gray-900 mt-3">{recipe.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{recipe.servings}인분</p>
        </div>

        {/* 시간 뱃지 */}
        <div className={`grid gap-2 text-center ${recipe.isCombo ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-lg font-black text-orange-500">{parallelMin}분</p>
            <p className="text-xs text-orange-600 mt-0.5">조리 시간</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-lg font-black text-gray-700">{recipe.ingredients.length}가지</p>
            <p className="text-xs text-gray-500 mt-0.5">재료</p>
          </div>
          {recipe.isCombo && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-lg font-black text-green-600">-{sequentialMin - parallelMin}분</p>
              <p className="text-xs text-green-600 mt-0.5">시간 절약</p>
            </div>
          )}
        </div>

        {/* 소개 */}
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
          {recipe.story}
        </p>

        {/* 주재료 */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-3">주재료</h2>
          <div className="grid grid-cols-2 gap-2">
            {mainIngredients.map(ing => (
              <div key={ing.ingredient_id} className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                <span className="text-orange-400 text-xs font-bold">●</span>
                <span className="text-sm text-gray-700 font-medium">{ing.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{ing.base_amount}{ing.unit}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 양념 */}
        {seasonings.length > 0 && (
          <section>
            <h2 className="text-base font-black text-gray-900 mb-3">양념</h2>
            <div className="flex flex-wrap gap-2">
              {seasonings.map(ing => (
                <span key={ing.ingredient_id} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                  {ing.name} {ing.base_amount}{ing.unit}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 조리 단계 */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-3">조리 순서</h2>
          {recipe.isCombo && (
            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-3 mb-3">
              <p className="text-xs font-bold text-purple-700">⚡ 2구 병렬 조리</p>
              <p className="text-xs text-purple-600 mt-0.5">🔥 1구 화구와 💧 2구 화구를 동시에 사용합니다</p>
            </div>
          )}
          <div className="space-y-2">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  step.burner === 1 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{step.action}</p>
                    <span className="text-xs text-gray-400">{Math.round(step.duration_sec / 60)}분</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 조리 시작 버튼 */}
        <div className="pb-8 pt-2">
          <StartCookingButton recipeId={recipe.id} isCombo={recipe.isCombo} />
        </div>
      </article>
    </div>
  );
}
