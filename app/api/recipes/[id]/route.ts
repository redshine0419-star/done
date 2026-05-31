import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function db() {
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL!);
}

function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return Boolean(secret && secret === process.env.ADMIN_SECRET);
}

type Params = { id: string };

// PUT: wiki-style edit (existing DB recipe) OR fork-save (new recipe from client)
export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const sql = await db();
    const { id } = await params;
    const body = await req.json() as {
      title?: string;
      story?: string;
      servings?: number;
      youtube_id?: string | null;
      youtube_credit?: string;
      thumbnail?: string;
      category?: string | null;
      ingredients?: { ingredient_id: string; name: string; base_amount: number; unit: string; type: string }[];
      steps?: { burner: number | null; action: string; duration_sec: number; description: string }[];
    };

    await sql`ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT`.catch(() => {});

    const isCombo = body.steps?.some(s => s.burner === 2) ?? false;

    // Upsert: handles both existing DB recipes and mock recipes being edited for the first time
    await sql`
      INSERT INTO recipes (id, title, story, thumbnail, is_combo, servings, youtube_id, youtube_credit, category, status, submitted_by)
      VALUES (
        ${id},
        ${body.title ?? 'Untitled'},
        ${body.story ?? ''},
        ${body.thumbnail ?? '🍳'},
        ${isCombo},
        ${body.servings ?? 2},
        ${body.youtube_id ?? null},
        ${body.youtube_credit ?? ''},
        ${body.category ?? null},
        'published',
        'wiki'
      )
      ON CONFLICT (id) DO UPDATE SET
        title          = COALESCE(${body.title ?? null}, recipes.title),
        story          = COALESCE(${body.story ?? null}, recipes.story),
        servings       = COALESCE(${body.servings ?? null}, recipes.servings),
        youtube_id     = ${body.youtube_id ?? null},
        youtube_credit = ${body.youtube_credit ?? ''},
        thumbnail      = COALESCE(${body.thumbnail ?? null}, recipes.thumbnail),
        category       = ${body.category ?? null},
        updated_at     = NOW()
    `;

    if (body.ingredients) {
      await sql`DELETE FROM recipe_ingredients WHERE recipe_id = ${id}`;
      await Promise.all(body.ingredients.map((ing, i) => {
        const amt = typeof ing.base_amount === 'number' ? ing.base_amount : (parseFloat(String(ing.base_amount)) || 0);
        return sql`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, name, base_amount, unit, type, sort_order)
          VALUES (${id}, ${ing.ingredient_id || ing.name}, ${ing.name}, ${amt}, ${ing.unit}, ${ing.type}, ${i})
        `;
      }));
    }

    if (body.steps) {
      await sql`DELETE FROM recipe_steps WHERE recipe_id = ${id}`;
      await Promise.all(body.steps.map((step, i) => {
        const burner = step.burner === 1 || step.burner === 2 ? step.burner : null;
        return sql`
          INSERT INTO recipe_steps (recipe_id, burner, action, duration_sec, description, sort_order)
          VALUES (${id}, ${burner}, ${step.action}, ${step.duration_sec}, ${step.description ?? ''}, ${i})
        `;
      }));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Admin only: delete
export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sql = await db();
    const { id } = await params;
    await sql`DELETE FROM recipes WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Admin only: status change
export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sql = await db();
    const { id } = await params;
    const { status } = await req.json() as { status: 'draft' | 'published' | 'rejected' };
    await sql`UPDATE recipes SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
