import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);

    const [blogTotal, recipeTotal, recentBlogs, recent5, emailCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published'`,
      sql`SELECT COUNT(*) as count FROM recipes WHERE status = 'published'`,
      sql`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published' AND published_at > NOW() - INTERVAL '7 days'`,
      sql`SELECT id, title, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 5`,
      sql`SELECT COUNT(*) as count FROM email_subscribers WHERE service = 'flavorsync'`.catch(() => [{ count: 0 }]),
    ]);

    return NextResponse.json({
      service: 'flavorsync',
      domain: 'flavorsync.me',
      blog: {
        total: Number(blogTotal[0].count),
        recentWeek: Number(recentBlogs[0].count),
        recent: recent5.map((p) => ({ title: p.title, id: p.id, publishedAt: p.published_at })),
      },
      recipe: { total: Number(recipeTotal[0].count) },
      emailSubscribers: Number(emailCount[0]?.count ?? 0),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
