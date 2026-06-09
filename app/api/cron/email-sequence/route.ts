import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'hello@flavorsync.me';

const SEQUENCE = [
  {
    dayOffset: 3,
    subject: '[FlavorSync] 오늘 눈여겨보세요: 핵심 기능 안내',
    html: `<h2>안녕하세요! FlavorSync 핵심 기능을 안내해 드릴게요.</h2>
<ul>
  <li><strong>냉장고 관리</strong> — 식재료와 유통기한 입력</li>
  <li><strong>AI 레시피 추천</strong> — 냉장고 속 재료로 맞춤 요리</li>
  <li><strong>즉시 조리 부스터</strong> — 단계별 관리로 효율적 요리</li>
</ul>
<p><a href="https://flavorsync.me" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">→ FlavorSync 시작하기</a></p>`,
  },
  {
    dayOffset: 7,
    subject: '[FlavorSync] 냉파 레시피 5가지를 추천해드릴게요',
    html: `<h2>이번 주 냉파 레시피 인기 BEST 5</h2>
<p>냉장고에 남은 재료로 만들 수 있는 인기 레시피를 전달해드립니다.</p>
<p><a href="https://flavorsync.me/blog">새로운 레시피 아이디어 보기 →</a></p>`,
  },
  {
    dayOffset: 14,
    subject: '[FlavorSync] 유통기한 임박 재료를 활용하는 노하우',
    html: `<h2>유통기한 D-3 재료로 맛있는 요리 만드기</h2>
<p>유통기한이 다가오는 재료로 만들 수 있는 레시피를 AI가 있다고? FlavorSync에서 확인해보세요.</p>
<p><a href="https://flavorsync.me" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">→ 재방문 하기</a></p>`,
  },
];

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL!);
  await sql`CREATE TABLE IF NOT EXISTS email_subscribers (
    id SERIAL PRIMARY KEY, email TEXT NOT NULL,
    service TEXT NOT NULL DEFAULT 'flavorsync',
    source TEXT NOT NULL DEFAULT 'landing',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (email, service)
  )`.catch(() => {});

  const now = new Date();
  let sent = 0;

  for (const step of SEQUENCE) {
    const windowStart = new Date(now.getTime() - (step.dayOffset + 0.5) * 86400000);
    const windowEnd = new Date(now.getTime() - (step.dayOffset - 0.5) * 86400000);
    const rows = await sql`
      SELECT email FROM email_subscribers
      WHERE service = 'flavorsync' AND created_at BETWEEN ${windowStart.toISOString()} AND ${windowEnd.toISOString()}
    `;
    for (const row of rows) {
      await sendEmail(row.email as string, step.subject, step.html);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
