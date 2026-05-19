import type { BlogPost } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

async function supabaseGet<T>(table: string, params: Record<string, string>): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars not set');
  const qs = new URLSearchParams({ select: '*', ...params }).toString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}`);
  return res.json();
}

function rowToPost(row: Record<string, unknown>): BlogPost {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as BlogPost['category'],
    thumbnail: row.thumbnail as string,
    summary: row.summary as string,
    body: row.body as string,
    author: row.author as string,
    published_at: row.published_at as string,
    tags: row.tags as string[],
    readTime: row.read_time as number,
    related_recipe_id: row.related_recipe_id as string | undefined,
  };
}

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const rows = await supabaseGet<Record<string, unknown>>('blog_posts', {
    status: 'eq.published',
    order: 'published_at.desc',
  });
  return rows.map(rowToPost);
}

export async function publishPost(postId: string, adminSecret: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars not set');
  await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${postId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${adminSecret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'published' }),
  });
}
