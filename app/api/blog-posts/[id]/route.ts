import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function db() {
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL!);
}

function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

type Params = { id: string };

// PUT: edit blog post
export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as {
    title?: string;
    summary?: string;
    body?: string;
    category?: string;
    thumbnail?: string;
    tags?: string[];
    read_time?: number;
  };
  const sql = await db();
  await sql`
    UPDATE blog_posts SET
      title      = COALESCE(${body.title ?? null}, title),
      summary    = COALESCE(${body.summary ?? null}, summary),
      body       = COALESCE(${body.body ?? null}, body),
      category   = COALESCE(${body.category ?? null}, category),
      thumbnail  = COALESCE(${body.thumbnail ?? null}, thumbnail),
      tags       = COALESCE(${body.tags ?? null}, tags),
      read_time  = COALESCE(${body.read_time ?? null}, read_time),
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true });
}

// DELETE: remove blog post
export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const sql = await db();
  await sql`DELETE FROM blog_posts WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

// PATCH: change status
export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json() as { status: 'draft' | 'published' };
  const sql = await db();
  await sql`UPDATE blog_posts SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
