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

async function getGA4Token(): Promise<string | null> {
  const refreshToken = process.env.GSC_REFRESH_TOKEN
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!refreshToken || !clientId || !clientSecret) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!res.ok) return null
  const data = await res.json() as { access_token?: string }
  return data.access_token || null
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    return NextResponse.json({ skipped: true, reason: 'GA4_PROPERTY_ID not set' })
  }

  try {
    const accessToken = await getGA4Token()
    if (!accessToken) {
      return NextResponse.json({ skipped: true, reason: 'No GA4 token' })
    }

    const ga4Res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'sessions' },
          ],
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          orderBys: [{ metric: { metricName: 'averageSessionDuration' }, desc: true }],
          limit: 50,
        }),
      }
    )

    if (!ga4Res.ok) return NextResponse.json({ skipped: true, reason: 'GA4 API error' })

    interface GA4Row { dimensionValues: { value: string }[]; metricValues: { value: string }[] }
    const ga4Data = await ga4Res.json() as { rows?: GA4Row[] }
    const rows = ga4Data.rows || []

    const pages = rows.map((row) => ({
      path: row.dimensionValues[0]?.value || '',
      avgDuration: parseFloat(row.metricValues[0]?.value || '0'),
      bounceRate: parseFloat(row.metricValues[1]?.value || '0'),
    }))

    const top20Pct = pages.slice(0, Math.max(1, Math.ceil(pages.length * 0.2)))
    const highBounce = pages.filter((p) => p.bounceRate > 0.8)

    const topLines = top20Pct.slice(0, 5).map((p, i) => `${i + 1}. ${p.path} - ${Math.round(p.avgDuration)}초`).join('\n')
    const bounceLines = highBounce.slice(0, 5).map((p, i) => `${i + 1}. ${p.path} - ${Math.round(p.bounceRate * 100)}%`).join('\n')

    await notifySlack(`📊 [FlavorSync] 월간 AdSense 최적화 리포트\n\n📈 광고 추가 추천:\n${topLines || '없음'}\n\n📉 CTA 전환 권장 (이탈률 80%+):\n${bounceLines || '없음'}`)

    return NextResponse.json({ ok: true, topPages: top20Pct.length, highBouncePages: highBounce.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
