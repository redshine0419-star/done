import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function db() {
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL!);
}

async function ensureTable(sql: Awaited<ReturnType<typeof db>>) {
  await sql`
    CREATE TABLE IF NOT EXISTS user_fridge_items (
      user_id       TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      name          TEXT NOT NULL,
      amount        NUMERIC NOT NULL DEFAULT 0,
      unit          TEXT NOT NULL DEFAULT '',
      expire_date   TEXT,
      icon          TEXT,
      registered_at TEXT,
      PRIMARY KEY (user_id, ingredient_id)
    )
  `.catch(() => {});
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([]);

  const sql = await db();
  await ensureTable(sql);
  const rows = await sql`SELECT * FROM user_fridge_items WHERE user_id = ${session.user.id}`;
  return NextResponse.json(rows.map(r => ({
    ingredient_id: r.ingredient_id,
    name: r.name,
    amount: Number(r.amount),
    unit: r.unit,
    expire_date: r.expire_date ?? '',
    icon: r.icon ?? '🥗',
    registered_at: r.registered_at ?? new Date().toISOString(),
  })));
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { items } = await req.json() as { items: { ingredient_id: string; name: string; amount: number; unit: string; expire_date?: string; icon?: string; registered_at?: string }[] };
  const sql = await db();
  await ensureTable(sql);

  await sql`DELETE FROM user_fridge_items WHERE user_id = ${session.user.id}`;

  if (items?.length > 0) {
    await Promise.all(items.map(item => sql`
      INSERT INTO user_fridge_items (user_id, ingredient_id, name, amount, unit, expire_date, icon, registered_at)
      VALUES (
        ${session.user.id}, ${item.ingredient_id}, ${item.name}, ${item.amount},
        ${item.unit}, ${item.expire_date ?? null}, ${item.icon ?? '🥗'}, ${item.registered_at ?? new Date().toISOString()}
      )
    `));
  }

  return NextResponse.json({ ok: true });
}
