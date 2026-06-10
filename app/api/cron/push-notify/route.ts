import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function sendFCMNotification(fcmToken: string, title: string, body: string, url?: string): Promise<void> {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) return;
  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: { Authorization: `key=${serverKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: fcmToken,
      notification: { title, body, click_action: url ?? 'https://flavorsync.me' },
    }),
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

  // 유통기한 D-3 알림
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const expiringItems = await sql`
    SELECT fi.user_id, fi.name, fi.expire_date, ps.endpoint
    FROM user_fridge_items fi
    JOIN push_subscriptions ps ON ps.user_id = fi.user_id
    WHERE fi.expire_date = ${threeDaysLater}
  `.catch(() => []);

  let notified = 0;
  for (const item of expiringItems) {
    await sendFCMNotification(
      item.endpoint as string,
      '🛒 유통기한 임박!',
      `${item.name}의 유통기한이 3일 남았어요. 빨리 요리해보세요!`,
      'https://flavorsync.me'
    );
    notified++;
  }

  // 오늘의 추천 레시피 (전체 구독자에게)
  const hour = new Date().getUTCHours();
  if (hour === 22) { // 22:00 UTC = 07:00 KST
    const allSubs = await sql`SELECT endpoint FROM push_subscriptions`.catch(() => []);
    for (const sub of allSubs) {
      await sendFCMNotification(
        sub.endpoint as string,
        '🍳 오늘의 추천 레시피',
        'FlavorSync에서 오늘 요리할 레시피를 추천해드립니다!',
        'https://flavorsync.me'
      );
      notified++;
    }
  }

  return NextResponse.json({ notified });
}
