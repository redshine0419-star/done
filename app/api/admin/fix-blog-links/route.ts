import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

// Keyword → recipe ID mapping (priority order)
const KEYWORD_MAP: [string[], string][] = [
  [['제육볶음', '제육'], 'r2'],
  [['계란찜'], 'r2'],
  [['김치찌개', '묵은지'], 'r1'],
  [['된장찌개'], 'r3'],
  [['불고기'], 'r4'],
  [['미역국', '소고기 미역'], 'r4'],
  [['순두부'], 'r5'],
  [['잡채'], 'r6'],
  [['감자조림', '감자 조림'], 'r7'],
  [['콩나물', '국밥'], 'r8'],
  [['삼겹살'], 'r9'],
  [['시금치', '된장국'], 'r10'],
  [['닭볶음탕', '닭볶음'], 'r9'],
  [['볶음밥', '참치'], 'r8'],
  [['떡볶이'], 'r5'],
  [['계란볶음밥', '계란 볶음밥'], 'r1'],
];

function guessRecipeId(title: string, summary: string): string | null {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [keywords, recipeId] of KEYWORD_MAP) {
    if (keywords.some(kw => text.includes(kw))) return recipeId;
  }
  return null;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const posts = await sql`
      SELECT id, title, summary, related_recipe_id FROM blog_posts ORDER BY created_at DESC
    `;
    const preview = posts.map(p => ({
      id: p.id,
      title: p.title,
      current: p.related_recipe_id,
      suggested: guessRecipeId(p.title as string, p.summary as string),
    }));
    return NextResponse.json(preview);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const posts = await sql`SELECT id, title, summary, related_recipe_id FROM blog_posts`;

    const results: { id: string; title: string; from: string | null; to: string | null; changed: boolean }[] = [];

    for (const p of posts) {
      const suggested = guessRecipeId(p.title as string, p.summary as string);
      const current = p.related_recipe_id as string | null;
      if (suggested && suggested !== current) {
        await sql`UPDATE blog_posts SET related_recipe_id = ${suggested} WHERE id = ${p.id}`;
        results.push({ id: p.id as string, title: p.title as string, from: current, to: suggested, changed: true });
      } else {
        results.push({ id: p.id as string, title: p.title as string, from: current, to: current, changed: false });
      }
    }

    const changed = results.filter(r => r.changed).length;
    return NextResponse.json({ ok: true, changed, total: results.length, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
