import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function notifySlack(msg: string) {
  if (!process.env.SLACK_WEBHOOK_URL) return
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: msg }),
  }).catch(() => {})
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)

    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const monthLabel = `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`

    const [subTotal, subNew, blogNew] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM email_subscribers WHERE service = 'flavorsync'`.catch(() => [{ count: 0 }]),
      sql`SELECT COUNT(*) as count FROM email_subscribers WHERE service = 'flavorsync' AND created_at >= ${lastMonth.toISOString()} AND created_at <= ${lastMonthEnd.toISOString()}`.catch(() => [{ count: 0 }]),
      sql`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published' AND published_at >= ${lastMonth.toISOString()} AND published_at <= ${lastMonthEnd.toISOString()}`.catch(() => [{ count: 0 }]),
    ])

    const totalSubscribers = Number(subTotal[0]?.count || 0)
    const newSubscribers = Number(subNew[0]?.count || 0)
    const blogPostCount = Number(blogNew[0]?.count || 0)

    let aiSummary = '(AI 분석 불가)'
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      const prompt = `FlavorSync(레시피/냉파 서비스) ${monthLabel} 마케팅 성과: 신규구독자 ${newSubscribers}명, 누적 ${totalSubscribers}명, 발행블로그 ${blogPostCount}개. 성과요약과 다음달 액션플랜 3가지를 200자 이내로.`
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 512 } }),
      }).catch(() => null)
      if (res?.ok) {
        const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
        aiSummary = data.candidates?.[0]?.content?.parts?.[0]?.text || '(AI 분석 불가)'
      }
    }

    await notifySlack(
      `📅 [FlavorSync] ${monthLabel} 마케팅 월간 리뷰\n\n` +
      `📊 핵심 지표:\n• 신규 구독자: ${newSubscribers}명 (누적 ${totalSubscribers}명)\n• 발행 블로그: ${blogPostCount}개\n\n` +
      `🤖 AI 분석:\n${aiSummary}`
    )

    return NextResponse.json({ ok: true, month: monthLabel, newSubscribers, totalSubscribers, blogPostCount })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
