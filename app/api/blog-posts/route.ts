import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'edge';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
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
