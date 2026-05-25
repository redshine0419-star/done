import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function db() {
  return neon(process.env.DATABASE_URL!);
}

function requireAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return Boolean(secret && secret === process.env.ADMIN_SECRET);
}

type Params = { id: string };

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sql = db();
    const { id } = await params;
    const body = await req.json() as {
      title?: string;
      story?: string;
      servings?: number;
      youtube_id?: string;
      youtube_credit?: string;
    };

    await sql`
      UPDATE recipes SET
        title         = COALESCE(${body.title ?? null}, title),
        story         = COALESCE(${body.story ?? null}, story),
        servings      = COALESCE(${body.servings ?? null}, servings),
        youtube_id    = COALESCE(${body.youtube_id ?? null}, youtube_id),
        youtube_credit = COALESCE(${body.youtube_credit ?? null}, youtube_credit),
        updated_at    = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sql = db();
    const { id } = await params;
    await sql`DELETE FROM recipes WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sql = db();
    const { id } = await params;
    const { status } = await req.json() as { status: 'draft' | 'published' | 'rejected' };
    await sql`UPDATE recipes SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
