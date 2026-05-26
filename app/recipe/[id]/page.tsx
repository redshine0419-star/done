import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Users, Zap, PlayCircle, ExternalLink } from 'lucide-react';
import { neon } from '@neondatabase/serverless';
import { mockRecipes } from '@/data/mockRecipes';
import { StartCookingButton } from './StartCookingButton';
import { ServingsScaler } from '@/components/recipe/ServingsScaler';
import type { Recipe } from '@/types';

type Params = { id: string };

export function generateStaticParams() {
  return mockRecipes.map(r => ({ id: r.id }));
}

function getTotalMinutes(recipe: (typeof mockRecipes)[0]) {
  const b1 = recipe.steps.filter(s => s.burner === 1).reduce((a, s) => a + s.duration_sec, 0);
  const b2 = recipe.steps.filter(s => s.burner === 2).reduce((a, s) => a + s.duration_sec, 0);
  return Math.round(Math.max(b1, b2 || 0) / 60);
}

async function getRecipe(id: string): Promise<Recipe | null> {
  const mock = mockRecipes.find(r => r.id === id);
  if (mock) return mock as Recipe;
  if (!process.env.DATABASE_URL) return null;
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT r.*,
        COALESCE(
          (SELECT json_agg(jsonb_build_object(
            'ingredient_id', ri.ingredient_id, 'name', ri.name,
            'base_amount', ri.base_amount, 'unit', ri.unit, 'type', ri.type
          ) ORDER BY ri.sort_order) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id), '[]'
        ) AS ingredients,
        COALESCE(
          (SELECT json_agg(jsonb_build_object(
            'burner', rs.burner, 'action', rs.action,
            'duration_sec', rs.duration_sec, 'description', rs.description
          ) ORDER BY rs.sort_order) FROM recipe_steps rs WHERE rs.recipe_id = r.id), '[]'
        ) AS steps
      FROM recipes r WHERE r.id = ${id} AND r.status = 'published' LIMIT 1
    `;
    if (!rows[0]) return null;
    const row = rows[0] as Record<string, unknown>;
    return {
      id: row.id as string,
      title: row.title as string,
      story: (row.story ?? '') as string,
      thumbnail: (row.thumbnail ?? '🍳') as string,
      isCombo: (row.is_combo ?? false) as boolean,
      servings: (row.servings ?? 2) as number,
      youtube_id: row.youtube_id as string | undefined,
      youtube_credit: (row.youtube_credit ?? '') as string,
      ingredients: (row.ingredients ?? []) as Recipe['ingredients'],
      steps: (row.steps ?? []) as Recipe['steps'],
    };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) return { title: '레시피를 찾을 수 없어요' };
  const minutes = getTotalMinutes(recipe);
  const mainIngredients = recipe.ingredients.filter(i => i.type === 'main').map(i => i.name).join(', ');
  return {
    title: `${recipe.title} 레시피 — 플레이버 싱크`,
    description: `${recipe.story} 주재료: ${mainIngredients}. 조리시간 ${minutes}분, ${recipe.servings}인분.`,
    openGraph: { title: `${recipe.title} 레시피`, description: recipe.story, type: 'article' },
    twitter: { card: 'summary', title: `${recipe.title} 레시피`, description: recipe.story },
  };
}

export default async function RecipeDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const b1Steps = recipe.steps.filter(s => s.burner === 1);
  const b2Steps = recipe.steps.filter(s => s.burner === 2);
  const b1Total = b1Steps.reduce((a, s) => a + s.duration_sec, 0);
  const b2Total = b2Steps.reduce((a, s) => a + s.duration_sec, 0);
  const parallelMin = Math.round(Math.max(b1Total, b2Total || 0) / 60);
  const sequentialMin = Math.round((b1Total + b2Total) / 60);

  // Resolve sub-recipe titles for combo links
  const relatedSingles = recipe.related_single_ids
    ? recipe.related_single_ids.map(rid => mockRecipes.find(r => r.id === rid)).filter(Boolean)
    : [];

  // Resolve parent combo for single recipes
  const parentCombo = recipe.parent_combo_id
    ? mockRecipes.find(r => r.id === recipe.parent_combo_id)
    : null;

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
    recipeIngredient: recipe.ingredients.map(i => `${i.name} ${i.base_amount}${i.unit}`),
    recipeInstructions: recipe.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.action,
      text: step.description,
    })),
    keywords: [recipe.title, '레시피', '만들기', '집밥', ...recipe.ingredients.map(i => i.name)].join(', '),
  };

  return (
    <div className="max-w-md mx-auto min-h-dvh" style={{ background: 'var(--bg)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />

      <header className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/recipe"
              className="w-9 h-9 flex items-center justify-center rounded-xl touch-manipulation"
              style={{ background: 'var(--bg)' }}>
          <ArrowLeft size={18} color="var(--text-2)" strokeWidth={2} />
        </Link>
        <span className="font-semibold text-[15px] flex-1 truncate" style={{ color: 'var(--text-1)' }}>
          {recipe.title}
        </span>
        {recipe.isCombo && (
          <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#F0ECFF', color: '#6B3FD4' }}>
            2구 코스
          </span>
        )}
      </header>

      <article className="px-5 py-5 pb-12 md:grid md:grid-cols-[1fr_1.2fr] md:gap-8 md:items-start">

        {/* ── Left column ── */}
        <div className="space-y-6">

        {/* Hero card */}
        <div className="rounded-3xl overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #FEF0E8 0%, #FDE4D0 100%)', border: '1px solid rgba(201,75,42,0.15)' }}>
          <div className="px-6 pt-8 pb-5 text-center">
            <h1 className="text-[24px] font-black tracking-tight" style={{ color: 'var(--text-1)' }}>
              {recipe.title}
            </h1>
          </div>
          <div className={`grid gap-px ${recipe.isCombo ? 'grid-cols-3' : 'grid-cols-2'}`}
               style={{ borderTop: '1px solid rgba(201,75,42,0.12)' }}>
            <div className="py-4 text-center" style={{ background: 'rgba(255,255,255,0.65)' }}>
              <Clock size={13} color="var(--brand)" strokeWidth={2} className="mx-auto mb-1" />
              <p className="font-black text-[22px]" style={{ color: 'var(--brand)' }}>{parallelMin}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--brand)' }}>분</p>
            </div>
            <div className="py-4 text-center" style={{ background: 'rgba(255,255,255,0.45)' }}>
              <Users size={13} color="var(--text-3)" strokeWidth={2} className="mx-auto mb-1" />
              <p className="font-black text-[22px]" style={{ color: 'var(--text-1)' }}>{recipe.servings}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>인분</p>
            </div>
            {recipe.isCombo && (
              <div className="py-4 text-center" style={{ background: 'rgba(255,255,255,0.65)' }}>
                <Zap size={13} color="var(--green)" strokeWidth={2} className="mx-auto mb-1" />
                <p className="font-black text-[22px]" style={{ color: 'var(--green)' }}>
                  -{sequentialMin - parallelMin}
                </p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--green)' }}>분 절약</p>
              </div>
            )}
          </div>
        </div>

        {/* Parent combo notice */}
        {parentCombo && (
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
               style={{ background: '#F5F2FF', border: '1px solid #D9CFFF' }}>
            <div>
              <p className="text-[12px] font-bold" style={{ color: '#6B3FD4' }}>2구 코스에 포함된 레시피</p>
              <p className="text-[13px] mt-0.5" style={{ color: '#8B6FD4' }}>{parentCombo.title} 코스의 구성 요리</p>
            </div>
            <Link href={`/recipe/${parentCombo.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-bold touch-manipulation"
                  style={{ background: '#6B3FD4', color: 'white' }}>
              코스 보기
            </Link>
          </div>
        )}

        {/* Servings scaler + ingredients (client component) */}
        <ServingsScaler baseServings={recipe.servings} ingredients={recipe.ingredients} />

        {/* Combo → sub-recipe links */}
        {relatedSingles.length > 0 && (
          <section>
            <h2 className="text-[17px] font-black mb-3" style={{ color: 'var(--text-1)' }}>이 코스의 구성 레시피</h2>
            <div className="space-y-2">
              {relatedSingles.map(sub => sub && (
                <Link key={sub.id} href={`/recipe/${sub.id}`}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 touch-manipulation"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-2xl">{sub.thumbnail}</span>
                  <div className="flex-1">
                    <p className="font-bold text-[14px]" style={{ color: 'var(--text-1)' }}>{sub.title}</p>
                    <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{sub.story}</p>
                  </div>
                  <ArrowLeft size={16} color="var(--text-3)" strokeWidth={2} style={{ transform: 'rotate(180deg)' }} />
                </Link>
              ))}
            </div>
          </section>
        )}

        </div>{/* end left column */}

        {/* ── Right column ── */}
        <div className="space-y-6 mt-6 md:mt-0">

        {/* Story */}
        <p className="text-[14px] leading-[1.8]" style={{ color: 'var(--text-2)' }}>{recipe.story}</p>

        {/* YouTube */}
        <section>
          <h2 className="text-[17px] font-black mb-3" style={{ color: 'var(--text-1)' }}>조리 영상</h2>
          {recipe.youtube_id ? (
            <div className="space-y-2">
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingBottom: '56.25%', background: '#000' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${recipe.youtube_id}?rel=0`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${recipe.title} 조리 영상`}
                />
              </div>
              {recipe.youtube_credit && (
                <div className="flex items-center gap-1.5">
                  <ExternalLink size={12} color="var(--text-3)" />
                  <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                    참고 영상: {recipe.youtube_credit}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.title + ' 만들기 레시피')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl p-4 touch-manipulation"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: '#FEE2E2' }}>
                <PlayCircle size={22} color="#DC2626" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-bold text-[14px]" style={{ color: 'var(--text-1)' }}>유튜브에서 찾아보기</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {recipe.title} 만들기 영상 검색
                </p>
              </div>
            </a>
          )}
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-[17px] font-black mb-3" style={{ color: 'var(--text-1)' }}>조리 순서</h2>
          {recipe.isCombo && (
            <div className="rounded-2xl p-3 mb-4" style={{ background: '#F5F2FF', border: '1px solid #D9CFFF' }}>
              <p className="text-[12px] font-bold" style={{ color: '#6B3FD4' }}>2구 병렬 조리</p>
              <p className="text-[12px] mt-0.5" style={{ color: '#8B6FD4' }}>1구 화구와 2구 화구를 동시에 사용합니다</p>
            </div>
          )}
          <div className="space-y-4">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5"
                     style={{
                       background: step.burner === 1 ? 'var(--brand)' : step.burner === 2 ? '#2563EB' : 'var(--text-3)',
                       color: 'white',
                     }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[14px]" style={{ color: 'var(--text-1)' }}>{step.action}</p>
                    <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                      {Math.round(step.duration_sec / 60)}분
                    </span>
                  </div>
                  <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="pt-2">
          <StartCookingButton recipeId={recipe.id} isCombo={recipe.isCombo} />
        </div>

        </div>{/* end right column */}
      </article>
    </div>
  );
}
