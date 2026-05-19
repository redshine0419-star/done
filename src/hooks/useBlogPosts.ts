import { useState, useEffect, useMemo } from 'react';
import type { BlogPost, BlogCategory } from '@/types';
import { fetchPublishedPosts } from '@/services/blogService';
import { mockBlogPosts } from '@/data/mockBlogPosts';

const USE_MOCK = !import.meta.env.VITE_SUPABASE_URL;

export function useBlogPosts(category: BlogCategory | null, query: string) {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK) {
      setAllPosts(mockBlogPosts);
      return;
    }
    setLoading(true);
    fetchPublishedPosts()
      .then(setAllPosts)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const posts = useMemo(() =>
    allPosts
      .filter(p => !category || p.category === category)
      .filter(p => !query ||
        p.title.includes(query) ||
        p.summary.includes(query) ||
        p.tags.some(t => t.includes(query))
      ),
    [allPosts, category, query]
  );

  return { posts, loading, error };
}
