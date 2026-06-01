import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);

    const statusParam = req.nextUrl.searchParams.get('status');
    if (statusParam === 'draft' || statusParam === 'all') {
      if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rows = statusParam === 'all'
        ? await sql`
            SELECT id, title, category, thumbnail, summary, body, author,
                   published_at, tags, read_time AS "readTime", related_recipe_id, status
            FROM blog_posts ORDER BY created_at DESC
          `
        : await sql`
            SELECT id, title, category, thumbnail, summary, body, author,
                   published_at, tags, read_time AS "readTime", related_recipe_id, status
            FROM blog_posts WHERE status = 'draft' ORDER BY created_at DESC
          `;
      return NextResponse.json(rows);
    }

    const rows = await sql`
      SELECT id, title, category, thumbnail, summary, body, author,
             published_at, tags, read_time AS "readTime", related_recipe_id
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
