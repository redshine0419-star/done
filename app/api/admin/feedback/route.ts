import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);

    // 테이블 존재 여부 확인
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'feedback'
    `;
    if (tables.length === 0) {
      return NextResponse.json({ exists: false, message: 'feedback 테이블이 없습니다.' });
    }

    const rows = await sql`SELECT * FROM feedback ORDER BY created_at DESC LIMIT 50`;
    return NextResponse.json({ exists: true, count: rows.length, rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
