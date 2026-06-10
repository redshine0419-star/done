import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://flavorsync.me';
const GSC_SITE = process.env.GSC_SITE_URL ?? SITE_URL;

async function getAccessToken(): Promise<string | null> {
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  if (!refreshToken) return null;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch { return null; }
}

async function getGSCKeywords(accessToken: string): Promise<{ keyword: string; postId: string; position: number }[]> {
  const endDate = new Date();
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query', 'page'],
        rowLimit: 100,
        dimensionFilterGroups: [{
          filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }],
        }],
      }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.rows ?? []).filter(
    (r: { position: number }) => r.position >= 11 && r.position <= 20
  ).map((r: { keys: string[]; position: number }) => {
    const postId = (r.keys[1] ?? '').split('/blog/').pop() ?? '';
    return { keyword: r.keys[0], postId, position: Math.round(r.position) };
  });
}

async function enhancePost(body: string, keyword: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `다음 블로그 포스트에 "${keyword}" 키워드를 타깃으로 하는 새 섹션(H2)을 추가해주세요.\n\n기존 내용:\n${body.slice(0, 3000)}\n\n요구사항:\n- 기존 내용 뒤에 ## 제목으로 새 섹션 추가 (200자 이상)\n- 키워드 "${keyword}"를 자연스럽게 2-3회 포함\n- 마크다운 형식 유지\n- 전체 포스트(기존+추가)를 그대로 반환`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096 } }),
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || body;
  } catch { return body; }
}

async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !urls.length) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: 'flavorsync.me', key, urlList: urls }),
    });
  } catch { /* ignore */ }
}

async function notifySlack(msg: string) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: msg }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({ skipped: 'GSC_REFRESH_TOKEN not set' });

  const opportunities = await getGSCKeywords(accessToken);
  if (!opportunities.length) return NextResponse.json({ skipped: 'No 11-20 rank keywords' });

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL!);

  const enhanced: string[] = [];
  for (const opp of opportunities.slice(0, 5)) {
    try {
      const rows = await sql`SELECT id, body FROM blog_posts WHERE id = ${opp.postId} AND status = 'published'`;
      if (!rows.length) continue;
      const post = rows[0] as { id: string; body: string };
      const newBody = await enhancePost(post.body, opp.keyword);
      await sql`UPDATE blog_posts SET body = ${newBody}, updated_at = NOW() WHERE id = ${post.id}`;
      enhanced.push(`${SITE_URL}/blog/${post.id}`);
    } catch { /* continue */ }
  }

  await pingIndexNow(enhanced);
  if (enhanced.length > 0) {
    await notifySlack(`🔍 [FlavorSync] GSC 11~20위 포스트 ${enhanced.length}개 자동 보강\n${enhanced.join('\n')}`);
  }

  return NextResponse.json({ enhanced });
}
