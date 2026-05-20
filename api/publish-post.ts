import { neon } from '@neondatabase/serverless';

interface VReq {
  headers: Record<string, string | string[] | undefined>;
  body: { post_id?: string };
}
interface VRes {
  status(code: number): VRes;
  json(body: unknown): void;
}

export default async function handler(req: VReq, res: VRes) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { post_id } = req.body ?? {};
  if (!post_id) {
    return res.status(400).json({ error: 'post_id required' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE blog_posts
      SET status = 'published', published_at = NOW()
      WHERE id = ${post_id}
    `;
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
