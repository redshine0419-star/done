import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const host = req.headers.get('host') ?? '';
  const country = req.headers.get('x-vercel-ip-country') ?? '';
  const ua = req.headers.get('user-agent') ?? '';

  const isBot = /Googlebot|AdsBot-Google|Mediapartners-Google|bingbot|facebookexternalhit/i.test(ua);
  const isEnSubdomain = host.startsWith('en.');

  // 루트(/) 방문 시 비-KR 사용자 → en.flavorsync.me 리다이렉트
  if (!isBot && !isEnSubdomain && pathname === '/') {
    const rootHost = host.replace(/^www\./, '');
    if (country !== '' && country !== 'KR') {
      const url = req.nextUrl.clone();
      url.hostname = `en.${rootHost}`;
      return NextResponse.redirect(url);
    }
  }

  const lang = isEnSubdomain ? 'en' : 'ko';
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-lang', lang);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next|favicon|sitemap|robots|manifest).*)'],
};
