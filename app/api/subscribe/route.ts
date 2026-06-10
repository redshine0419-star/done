import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'hello@flavorsync.me';

async function sendWelcomeEmail(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: '[FlavorSync] 냉장고 식재료 관리 시트 다운로드 하세요 🍳',
      html: `
        <h2>FlavorSync에 오신 것을 환영합니다!</h2>
        <p>AI가 냉장고 속 재료로 맞춤 레시피를 추천해드립니다.</p>
        <p><a href="https://flavorsync.me" style="background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">→ FlavorSync 무료로 시작하기</a></p>
        <hr/>
        <p style="color:#6b7280;font-size:12px;">레시피 블로그: <a href="https://flavorsync.me/blog">https://flavorsync.me/blog</a></p>
      `,
    }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json() as { email?: string; source?: string };
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return NextResponse.json({ error: '유효하지 않은 이메일' }, { status: 400 });
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    await sql`CREATE TABLE IF NOT EXISTS email_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      service TEXT NOT NULL DEFAULT 'flavorsync',
      source TEXT NOT NULL DEFAULT 'landing',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email, service)
    )`;
    await sql`
      INSERT INTO email_subscribers (email, service, source)
      VALUES (${email}, 'flavorsync', ${source ?? 'landing'})
      ON CONFLICT (email, service) DO NOTHING
    `;

    await sendWelcomeEmail(email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
