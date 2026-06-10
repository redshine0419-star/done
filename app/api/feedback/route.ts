import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 3

function hashIp(ip: string): string {
  let h = 0
  for (let i = 0; i < ip.length; i++) h = (Math.imul(31, h) + ip.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '0'
}

function parseCaptcha(q: string): { a: number; op: '+' | '-'; b: number } {
  const m = q.match(/(\d+)\s*([+\-])\s*(\d+)/)
  if (!m) return { a: 0, op: '+', b: 0 }
  return { a: Number(m[1]), op: m[2] as '+' | '-', b: Number(m[3]) }
}

async function getSql() {
  const { neon } = await import('@neondatabase/serverless')
  return neon(process.env.DATABASE_URL!)
}

async function ensureTable() {
  const sql = await getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      nickname TEXT NOT NULL DEFAULT '익명',
      content TEXT NOT NULL,
      rating INTEGER,
      ip_hash TEXT NOT NULL DEFAULT '',
      is_hidden BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function GET(req: NextRequest) {
  await ensureTable()
  const sql = await getSql()
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1'))
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const rows = await sql`
    SELECT id, nickname, content, rating, created_at
    FROM feedback WHERE is_hidden = false
    ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
  `
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM feedback WHERE is_hidden = false`
  return NextResponse.json({ rows, total: count, page, pageSize })
}

export async function POST(req: NextRequest) {
  await ensureTable()
  const sql = await getSql()

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 }) }

  const { nickname, content, rating, captchaAnswer, captchaQuestion, honeypot } = body

  if (honeypot) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const cleanContent = String(content ?? '').trim()
  if (!cleanContent || cleanContent.length < 5)
    return NextResponse.json({ error: '5자 이상 입력해주세요.' }, { status: 400 })
  if (cleanContent.length > 1000)
    return NextResponse.json({ error: '최대 1000자까지 가능합니다.' }, { status: 400 })

  const { a, op, b } = parseCaptcha(captchaQuestion ?? '')
  const expected = op === '+' ? a + b : a - b
  if (Number(captchaAnswer) !== expected)
    return NextResponse.json({ error: '자동 입력 방지 답이 틀렸습니다.' }, { status: 400 })

  const ip = getIp(req)
  const ipHash = hashIp(ip)
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const [{ count: recentCount }] = await sql`
    SELECT COUNT(*)::int AS count FROM feedback WHERE ip_hash = ${ipHash} AND created_at > ${since}
  `
  if (recentCount >= RATE_LIMIT_MAX)
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (10분에 3개 제한)' }, { status: 429 })

  const cleanNickname = String(nickname ?? '').trim().slice(0, 30) || '익명'
  const cleanRating = rating ? Math.min(5, Math.max(1, Number(rating))) : null

  const [row] = await sql`
    INSERT INTO feedback (nickname, content, rating, ip_hash)
    VALUES (${cleanNickname}, ${cleanContent}, ${cleanRating}, ${ipHash})
    RETURNING id, nickname, content, rating, created_at
  `
  return NextResponse.json({ ok: true, row })
}

export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await ensureTable()
  const sql = await getSql()
  await sql`UPDATE feedback SET is_hidden = true WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
