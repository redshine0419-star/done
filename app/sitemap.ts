import type { MetadataRoute } from 'next';
import { mockRecipes } from '@/data/mockRecipes';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://flavorsync.me';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,             lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/recipe`, lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/blog`,   lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/fridge`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/taste`,  lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const mockRecipeRoutes: MetadataRoute.Sitemap = mockRecipes.map(r => ({
    url: `${base}/recipe/${r.id}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  let dbRecipeRoutes: MetadataRoute.Sitemap = [];
  let dbBlogRoutes: MetadataRoute.Sitemap = [];

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const [recipes, posts] = await Promise.all([
      sql`SELECT id, updated_at FROM recipes WHERE status = 'published'`,
      sql`SELECT id, published_at FROM blog_posts WHERE status = 'published'`,
    ]);

    dbRecipeRoutes = recipes.map(r => ({
      url: `${base}/recipe/${r.id as string}`,
      lastModified: r.updated_at ? new Date(r.updated_at as string) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    dbBlogRoutes = posts.map(p => ({
      url: `${base}/blog/${p.id as string}`,
      lastModified: p.published_at ? new Date(p.published_at as string) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable — sitemap will include only static routes and mock data
  }

  return [...staticRoutes, ...mockRecipeRoutes, ...dbRecipeRoutes, ...dbBlogRoutes];
}
