import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function db() {
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL!);
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    story: row.story ?? '',
    thumbnail: row.thumbnail ?? '🍳',
    isCombo: row.is_combo ?? false,
    servings: row.servings ?? 2,
    category: row.category ?? undefined,
    youtube_id: row.youtube_id ?? undefined,
    youtube_credit: row.youtube_credit ?? '',
    parent_combo_id: row.parent_combo_id ?? undefined,
    related_single_ids: (row.related_single_ids as string[] | null) ?? undefined,
    status: row.status,
    submitted_by: row.submitted_by,
    created_at: row.created_at,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const sql = await db();
    const { searchParams } = new URL(req.url);
    const adminSecret = req.headers.get('x-admin-secret');
    const isAdmin = adminSecret && adminSecret === process.env.ADMIN_SECRET;

    const checkYoutubeId = searchParams.get('youtube_id');
    if (checkYoutubeId) {
      const rows = await sql`
        SELECT id, title, youtube_id, youtube_credit, status, thumbnail, servings
        FROM recipes WHERE youtube_id = ${checkYoutubeId} LIMIT 1
      `;
      return NextResponse.json(rows[0] ?? null);
    }

    const checkTitle = searchParams.get('title');
    if (checkTitle) {
      const rows = await sql`
        SELECT id, title, youtube_id, youtube_credit, status, thumbnail, servings
        FROM recipes WHERE LOWER(title) = LOWER(${checkTitle}) LIMIT 1
      `;
      return NextResponse.json(rows[0] ?? null);
    }

    const statusFilter = isAdmin ? ['draft', 'published', 'rejected'] : ['published'];

    const recipes = await sql`
      SELECT r.*,
        COALESCE(
          (SELECT json_agg(jsonb_build_object(
            'ingredient_id', ri.ingredient_id,
            'name', ri.name,
            'base_amount', ri.base_amount,
            'unit', ri.unit,
            'type', ri.type
          ) ORDER BY ri.sort_order)
          FROM recipe_ingredients ri WHERE ri.recipe_id = r.id),
          '[]'
        ) AS ingredients,
        COALESCE(
          (SELECT json_agg(jsonb_build_object(
            'burner', rs.burner,
            'action', rs.action,
            'duration_sec', rs.duration_sec,
            'description', rs.description
          ) ORDER BY rs.sort_order)
          FROM recipe_steps rs WHERE rs.recipe_id = r.id),
          '[]'
        ) AS steps
      FROM recipes r
      WHERE r.status = ANY(${statusFilter})
      ORDER BY r.created_at DESC
    `;

    return NextResponse.json(recipes.map(mapRow));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = await db();
    const body = await req.json() as {
      youtube_id?: string;
      title: string;
      story: string;
      servings: number;
      thumbnail?: string;
      youtube_credit?: string;
      category?: string;
      _hp?: string;
      ingredients: { ingredient_id: string; name: string; base_amount: number; unit: string; type: string }[];
      steps: { burner: number | null; action: string; duration_sec: number; description: string }[];
    };

    await sql`ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT`.catch(() => {});

    // Honeypot — bots fill it, humans leave it blank
    if (body._hp) {
      return NextResponse.json({ id: 'ok', status: 'published' }, { status: 201 });
    }

    // YouTube ID required
    if (!body.youtube_id) {
      return NextResponse.json({ error: '유튜브 영상 URL이 필요합니다.' }, { status: 400 });
    }

    // Minimum content
    if (!body.title?.trim()) {
      return NextResponse.json({ error: '레시피 제목을 입력해주세요.' }, { status: 400 });
    }
    if (!body.ingredients || body.ingredients.length < 2) {
      return NextResponse.json({ error: '재료는 최소 2개 이상 필요합니다.' }, { status: 400 });
    }
    if (!body.steps || body.steps.length < 2) {
      return NextResponse.json({ error: '조리 단계는 최소 2개 이상 필요합니다.' }, { status: 400 });
    }

    // IP-based rate limiting: max 5 per 24h
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
    const ipHash = Buffer.from(ip).toString('base64').slice(0, 20);
    const recent = await sql`
      SELECT COUNT(*) AS cnt FROM recipes
      WHERE submitted_by = ${ipHash}
        AND created_at > NOW() - INTERVAL '24 hours'
    `;
    if (Number(recent[0].cnt) >= 5) {
      return NextResponse.json({ error: '하루 등록 한도(5개)를 초과했습니다. 내일 다시 시도해주세요.' }, { status: 429 });
    }

    // Duplicate YouTube ID
    const existing = await sql`SELECT id FROM recipes WHERE youtube_id = ${body.youtube_id} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: '이미 등록된 유튜브 영상입니다.', existing_id: existing[0].id }, { status: 409 });
    }

    const id = `db_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await sql`
      INSERT INTO recipes (id, title, story, thumbnail, is_combo, servings, youtube_id, youtube_credit, category, status, submitted_by)
      VALUES (
        ${id}, ${body.title}, ${body.story},
        ${body.thumbnail ?? '🍳'},
        false,
        ${body.servings ?? 2},
        ${body.youtube_id},
        ${body.youtube_credit ?? ''},
        ${body.category ?? null},
        'published',
        ${ipHash}
      )
    `;

    for (let i = 0; i < body.ingredients.length; i++) {
      const ing = body.ingredients[i];
      const amt = typeof ing.base_amount === 'number' ? ing.base_amount : (parseFloat(String(ing.base_amount)) || 0);
      await sql`
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, name, base_amount, unit, type, sort_order)
        VALUES (${id}, ${ing.ingredient_id || ing.name}, ${ing.name}, ${amt}, ${ing.unit}, ${ing.type}, ${i})
      `;
    }

    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      const burner = step.burner === 1 || step.burner === 2 ? step.burner : null;
      await sql`
        INSERT INTO recipe_steps (recipe_id, burner, action, duration_sec, description, sort_order)
        VALUES (${id}, ${burner}, ${step.action}, ${step.duration_sec}, ${step.description ?? ''}, ${i})
      `;
    }

    return NextResponse.json({ id, status: 'published' }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
