import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mockBlogPosts } from '@/data/mockBlogPosts';
import type { BlogPost } from '@/types';
import { StartCookingButton } from './StartCookingButton';

type Params = { slug: string };

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return mockBlogPosts.map(p => ({ slug: p.id }));
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const mock = mockBlogPosts.find(p => p.id === slug);
  if (mock) return mock;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, title, category, thumbnail, summary, body, author,
             published_at, tags, read_time AS "readTime", related_recipe_id
      FROM blog_posts
      WHERE id = ${slug} AND status = 'published'
      LIMIT 1
    `;
    if (!rows[0]) return null;
    const r = rows[0] as Record<string, unknown>;
    const publishedAt = r.published_at instanceof Date
      ? (r.published_at as Date).toISOString()
      : String(r.published_at ?? '');
    return {
      id: r.id as string,
      title: r.title as string,
      category: r.category as BlogPost['category'],
      thumbnail: r.thumbnail as string,
      summary: r.summary as string,
      body: r.body as string,
      author: r.author as string,
      published_at: publishedAt,
      tags: Array.isArray(r.tags) ? r.tags as string[] : [],
      readTime: r.readTime as number,
      related_recipe_id: r.related_recipe_id as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: '포스트를 찾을 수 없어요' };
  return {
    title: `${post.title} — 플레이버 싱크`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.summary,
    },
  };
}

function MarkdownBody({ body }: { body: string }) {
  const lines = body.split('\n');
  return (
    <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-bold text-gray-900 mt-4 pt-4 border-t border-gray-100">{line.slice(3)}</h2>;
        }
        if (line.startsWith('- ')) {
          return (
            <li key={i} className="flex gap-2 ml-2">
              <span className="text-orange-400 shrink-0">•</span>
              <InlineText text={line.slice(2)} />
            </li>
          );
        }
        if (line.trim() === '') return null;
        return <p key={i}><InlineText text={line} /></p>;
      })}
    </div>
  );
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-md mx-auto bg-white min-h-dvh">
      {/* Back header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/blog" className="text-gray-500 p-1 -ml-1 rounded-lg hover:bg-gray-100">
          ← 블로그
        </Link>
        <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
          {post.category}
        </span>
      </header>

      <article className="px-5 py-5 space-y-4">
        {/* Thumbnail + meta */}
        <div className="text-center py-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
          <span className="text-6xl">{post.thumbnail}</span>
          <p className="text-xs text-gray-400 mt-3">{post.readTime}분 읽기</p>
        </div>

        <h1 className="text-xl font-black text-gray-900 leading-tight">{post.title}</h1>

        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">{post.summary}</p>

        <div className="text-xs text-gray-400">
          <span>{post.published_at.slice(0, 10)}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        <hr className="border-gray-100" />

        <MarkdownBody body={post.body} />

        {post.related_recipe_id && (
          <div className="pt-4 pb-8">
            <StartCookingButton recipeId={post.related_recipe_id} />
          </div>
        )}
      </article>
    </div>
  );
}
