import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL || !process.env.RESEND_API_KEY || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'Missing env vars' })
  }

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)

    // Get subscribers
    const subscribers = await sql`
      SELECT email FROM email_subscribers WHERE service = 'flavorsync' LIMIT 100
    `.catch(() => []) as { email: string }[]

    if (!subscribers.length) return NextResponse.json({ ok: true, sent: 0 })

    // Get popular recipes (most liked)
    const popularRecipes = await sql`
      SELECT title, story FROM recipes WHERE status = 'published'
      ORDER BY like_count DESC LIMIT 3
    `.catch(() => []) as { title: string; story: string }[]

    const recipeList = popularRecipes.map((r, i) => `${i + 1}. ${r.title} — ${r.story}`).join('\n')

    // Generate personalized intro via Gemini
    const prompt = `FlavorSync 주간 레시피 추천 이메일 인트로를 따뜻하고 친근하게 2문장으로 작성해줘. 인기 레시피: ${recipeList || '다양한 레시피'}. 한국어로.`
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 256 } }),
      }
    ).catch(() => null)

    const geminiData = geminiRes?.ok ? await geminiRes.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] } : null
    const intro = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '이번 주 인기 레시피를 소개해드려요! 🍳'

    const recipeHtml = popularRecipes.map((r) =>
      `<li style="margin-bottom:8px"><strong>${r.title}</strong> — ${r.story}</li>`
    ).join('')

    let sent = 0
    for (const sub of subscribers) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'FlavorSync <hello@flavorsync.me>',
          to: sub.email,
          subject: '🍳 이번 주 인기 레시피 TOP 3',
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2>이번 주 인기 레시피 🍳</h2>
            <p>${intro.replace(/\n/g, '<br>')}</p>
            <ul style="padding-left:20px">${recipeHtml || '<li>다양한 레시피가 준비되어 있어요</li>'}</ul>
            <p><a href="https://flavorsync.me" style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">전체 레시피 보기 →</a></p>
            <p style="color:#999;font-size:12px">수신 거부: <a href="https://flavorsync.me/unsubscribe">여기를 클릭</a></p>
          </div>`,
        }),
      }).catch(() => {})
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
