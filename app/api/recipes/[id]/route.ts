import { NextRequest, NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

async function db() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return Boolean(secret && secret === process.env.ADMIN_SECRET);
}

type Params = { id: string };

// Public PUT: wiki-style recipe replacement (anyone can update content)
export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const sql = await db();
    const { id } = await params;
    const body = await req.json() as {
      title?: string;
      story?: string;
      servings?: number;
      youtube_id?: string;
      youtube_credit?: string;
      thumbnail?: string;
      category?: string | null;
      ingredients?: { ingredient_id: string; name: string; base_amount: number; unit: string; type: string }[];
      steps?: { burner: number | null; action: string; duration_sec: number; description: string }[];
    };

    await sql`ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT`.catch(() => {});

    await sql`
      UPDATE recipes SET
        title          = COALESCE(${body.title ?? null}, title),
        story          = COALESCE(${body.story ?? null}, story),
        servings       = COALESCE(${body.servings ?? null}, servings),
        youtube_id     = ${body.youtube_id ?? null},
        youtube_credit = ${body.youtube_credit ?? ''},
        thumbnail      = COALESCE(${body.thumbnail ?? null}, thumbnail),
        category       = ${'category' in body ? (body.category ?? null) : null},
        updated_at     = NOW()
      WHERE id = ${id}
    `;

    // Replace ingredients and steps if provided
    if (body.ingredients) {
      await sql`DELETE FROM recipe_ingredients WHERE recipe_id = ${id}`;
      for (let i = 0; i < body.ingredients.length; i++) {
        const ing = body.ingredients[i];
        await sql`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, name, base_amount, unit, type, sort_order)
          VALUES (${id}, ${ing.ingredient_id || ing.name}, ${ing.name}, ${ing.base_amount}, ${ing.unit}, ${ing.type}, ${i})
        `;
      }
    }

    if (body.steps) {
      await sql`DELETE FROM recipe_steps WHERE recipe_id = ${id}`;
      for (let i = 0; i < body.steps.length; i++) {
        const step = body.steps[i];
        await sql`
          INSERT INTO recipe_steps (recipe_id, burner, action, duration_sec, description, sort_order)
          VALUES (${id}, ${step.burner ?? null}, ${step.action}, ${step.duration_sec}, ${step.description ?? ''}, ${i})
        `;
      }
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
