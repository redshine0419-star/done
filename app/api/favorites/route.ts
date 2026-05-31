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
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id   TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, recipe_id)
    )
  `.catch(() => {});
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([]);

  const sql = await db();
  await ensureTable(sql);
  const rows = await sql`SELECT recipe_id FROM user_favorites WHERE user_id = ${session.user.id}`;
  return NextResponse.json(rows.map(r => r.recipe_id));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recipe_id } = await req.json() as { recipe_id: string };
  const sql = await db();
  await ensureTable(sql);

  const existing = await sql`
    SELECT 1 FROM user_favorites WHERE user_id = ${session.user.id} AND recipe_id = ${recipe_id}
  `;

  if (existing.length > 0) {
    await sql`DELETE FROM user_favorites WHERE user_id = ${session.user.id} AND recipe_id = ${recipe_id}`;
    return NextResponse.json({ action: 'removed' });
  } else {
    await sql`
      INSERT INTO user_favorites (user_id, recipe_id) VALUES (${session.user.id}, ${recipe_id})
      ON CONFLICT DO NOTHING
    `;
    return NextResponse.json({ action: 'added' });
  }
}
