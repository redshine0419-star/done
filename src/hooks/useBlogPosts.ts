import { useState, useEffect, useMemo } from 'react';
import type { BlogPost, BlogCategory } from '@/types';
import { fetchPublishedPosts } from '@/services/blogService';
import { mockBlogPosts } from '@/data/mockBlogPosts';

export function useBlogPosts(category: BlogCategory | null, query: string) {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchPublishedPosts()
      .then(posts => setAllPosts(posts.length > 0 ? posts : mockBlogPosts))
      .catch(() => setAllPosts(mockBlogPosts))
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
