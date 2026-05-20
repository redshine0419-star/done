import type { BlogPost } from '@/types';

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
  const res = await fetch('/api/blog-posts');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const rows = await res.json() as Record<string, unknown>[];
  return rows.map(rowToPost);
}
