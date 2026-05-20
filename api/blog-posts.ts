import { neon } from '@neondatabase/serverless';

interface VRes {
  status(code: number): VRes;
  json(body: unknown): void;
}

export default async function handler(_req: unknown, res: VRes) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, title, category, thumbnail, summary, body, author,
             published_at, tags, read_time, related_recipe_id
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    res.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
