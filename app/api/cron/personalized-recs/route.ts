import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ skipped: true, reason: 'No RESEND_API_KEY' })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL!)

  // Get users who have favorites (and have subscribed to emails)
  const users = await sql`
    SELECT DISTINCT uf.user_id, es.email
    FROM user_favorites uf
    JOIN email_subscribers es ON es.email = uf.user_id
    WHERE es.service = 'flavorsync'
    LIMIT 50
  `.catch(()=>[] as unknown[])

  let sent = 0
  for (const u of users as {user_id:string, email:string}[]) {
    const favs = await sql`SELECT recipe_id FROM user_favorites WHERE user_id = ${u.user_id} LIMIT 5`.catch(()=>[])
    if (!(favs as unknown[]).length) continue
    const favIds = (favs as {recipe_id:string}[]).map(f=>f.recipe_id)

    // Get 2 published recipes NOT in favorites as recommendations
    const recs = await sql`SELECT id, title FROM recipes WHERE status='published' AND id != ALL(${favIds}::text[]) ORDER BY like_count DESC LIMIT 2`.catch(()=>[])
    if (!(recs as unknown[]).length) continue

    const recList = (recs as {id:string,title:string}[]).map(r=>`• ${r.title}: https://flavorsync.me/recipe/${r.id}?utm_source=email&utm_medium=personalized&utm_campaign=recs`).join('\n')

    await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ Authorization:`Bearer ${resendKey}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        from: 'FlavorSync <noreply@flavorsync.me>',
        to: u.email,
        subject: '🍳 회원님 취향에 맞는 레시피를 발견했어요!',
        html: `<p>안녕하세요!</p><p>즐겨찾기 기반으로 추천드려요:</p><p>${recList.replace(/\n/g,'<br>')}</p><p><a href="https://flavorsync.me?utm_source=email&utm_medium=personalized">FlavorSync에서 더 보기 →</a></p>`,
      })
    }).catch(()=>{})
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
