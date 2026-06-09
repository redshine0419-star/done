import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

async function notifySlack(msg: string) {
  if (!process.env.SLACK_WEBHOOK_URL) return
  await fetch(process.env.SLACK_WEBHOOK_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text: msg}) }).catch(()=>{})
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL!)

  await sql`CREATE TABLE IF NOT EXISTS blog_ab_tests (
    id SERIAL PRIMARY KEY, post_id TEXT NOT NULL,
    variant_a TEXT NOT NULL, variant_b TEXT NOT NULL,
    clicks_a INTEGER DEFAULT 0, clicks_b INTEGER DEFAULT 0,
    impressions_a INTEGER DEFAULT 0, impressions_b INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), resolved BOOLEAN DEFAULT false, winner TEXT
  )`

  // Resolve old tests
  const oldTests = await sql`SELECT * FROM blog_ab_tests WHERE resolved = false AND created_at < NOW() - INTERVAL '7 days'`
  let resolved = 0
  for (const test of oldTests as {id:number, post_id:string, variant_a:string, variant_b:string, clicks_a:number, clicks_b:number, impressions_a:number, impressions_b:number}[]) {
    const ctrA = test.impressions_a > 0 ? test.clicks_a / test.impressions_a : 0
    const ctrB = test.impressions_b > 0 ? test.clicks_b / test.impressions_b : 0
    const winner = ctrA >= ctrB ? 'A' : 'B'
    const winTitle = winner === 'A' ? test.variant_a : test.variant_b
    await sql`UPDATE blog_posts SET title = ${winTitle} WHERE id = ${test.post_id}`
    await sql`UPDATE blog_ab_tests SET resolved = true, winner = ${winner} WHERE id = ${test.id}`
    await notifySlack(`📊 [FlavorSync] A/B 테스트 결과\n포스트: ${test.post_id}\n승자(${winner}): "${winTitle}"\nCTR A: ${(ctrA*100).toFixed(1)}% vs B: ${(ctrB*100).toFixed(1)}%`)
    resolved++
  }

  // Generate new tests for recent posts
  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey) {
    const recentPosts = await sql`SELECT id, title FROM blog_posts WHERE status = 'published' AND published_at > NOW() - INTERVAL '7 days'`
    for (const post of recentPosts as {id:string, title:string}[]) {
      const exists = await sql`SELECT 1 FROM blog_ab_tests WHERE post_id = ${post.id} AND resolved = false LIMIT 1`
      if ((exists as unknown[]).length > 0) continue
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{parts:[{text:`블로그 제목 대안 1개를 JSON 배열로: ["대안제목"]\n원제: "${post.title}"`}]}], generationConfig:{maxOutputTokens:256} })
        })
        const data = await res.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]}
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const alts = JSON.parse(text.replace(/```(?:json)?/gi,'').trim()) as string[]
        if (alts[0]) await sql`INSERT INTO blog_ab_tests (post_id, variant_a, variant_b) VALUES (${post.id}, ${post.title}, ${alts[0]})`
      } catch { /* skip */ }
    }
  }

  return NextResponse.json({ ok: true, resolved })
}
