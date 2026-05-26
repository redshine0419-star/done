import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function db() {
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
    const sql = db();
    const { searchParams } = new URL(req.url);
    const adminSecret = req.headers.get('x-admin-secret');
    const isAdmin = adminSecret && adminSecret === process.env.ADMIN_SECRET;

    // Duplicate check: ?youtube_id=xxx
    const checkYoutubeId = searchParams.get('youtube_id');
    if (checkYoutubeId) {
      const rows = await sql`
        SELECT id, title, youtube_id, youtube_credit, status, thumbnail, servings
        FROM recipes WHERE youtube_id = ${checkYoutubeId} LIMIT 1
      `;
      return NextResponse.json(rows[0] ?? null);
    }

    // Title check: ?title=xxx
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
          json_agg(DISTINCT jsonb_build_object(
            'ingredient_id', ri.ingredient_id,
            'name', ri.name,
            'base_amount', ri.base_amount,
            'unit', ri.unit,
            'type', ri.type
          ) ORDER BY jsonb_build_object('sort_order', ri.sort_order)) FILTER (WHERE ri.id IS NOT NULL),
          '[]'
        ) AS ingredients,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'burner', rs.burner,
            'action', rs.action,
            'duration_sec', rs.duration_sec,
            'description', rs.description
          ) ORDER BY jsonb_build_object('sort_order', rs.sort_order)) FILTER (WHERE rs.id IS NOT NULL),
          '[]'
        ) AS steps
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      LEFT JOIN recipe_steps rs ON rs.recipe_id = r.id
      WHERE r.status = ANY(${statusFilter})
      GROUP BY r.id
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
    const sql = db();
    const body = await req.json() as {
      youtube_id?: string;
      title: string;
      story: string;
      servings: number;
      thumbnail?: string;
      youtube_credit?: string;
      ingredients: { ingredient_id: string; name: string; base_amount: number; unit: string; type: string }[];
      steps: { burner: number | null; action: string; duration_sec: number; description: string }[];
    };

    // Final duplicate guard
    if (body.youtube_id) {
      const existing = await sql`SELECT id FROM recipes WHERE youtube_id = ${body.youtube_id} LIMIT 1`;
      if (existing.length > 0) {
        return NextResponse.json({ error: '이미 등록된 유튜브 영상입니다.', existing_id: existing[0].id }, { status: 409 });
      }
    }

    const id = `db_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await sql`
      INSERT INTO recipes (id, title, story, thumbnail, is_combo, servings, youtube_id, youtube_credit, status, submitted_by)
      VALUES (
        ${id}, ${body.title}, ${body.story},
        ${body.thumbnail ?? '🍳'},
        false,
        ${body.servings ?? 2},
        ${body.youtube_id ?? null},
        ${body.youtube_credit ?? ''},
        'published',
        'anonymous'
      )
    `;

    for (let i = 0; i < body.ingredients.length; i++) {
      const ing = body.ingredients[i];
      await sql`
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, name, base_amount, unit, type, sort_order)
        VALUES (${id}, ${ing.ingredient_id || ing.name}, ${ing.name}, ${ing.base_amount}, ${ing.unit}, ${ing.type}, ${i})
      `;
    }

    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      await sql`
        INSERT INTO recipe_steps (recipe_id, burner, action, duration_sec, description, sort_order)
        VALUES (${id}, ${step.burner ?? null}, ${step.action}, ${step.duration_sec}, ${step.description ?? ''}, ${i})
      `;
    }

    return NextResponse.json({ id, status: 'published' }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
