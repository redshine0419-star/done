import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { post_id } = await req.json() as { post_id?: string };
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 });

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE blog_posts
      SET status = 'published', published_at = NOW()
      WHERE id = ${post_id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
