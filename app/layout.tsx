import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from './providers';
import { isEn } from '@/i18n';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(isEn ? 'https://en.flavorsync.me' : 'https://flavorsync.me'),
  title: isEn
    ? 'FlavorSync — Smart Fridge & Recipes'
    : '플레이버 싱크 — 스마트 냉장고·레시피',
  description: isEn
    ? 'Fridge-based recipe recommendations. Receipt OCR auto-registration, dual-burner parallel cooking timer, taste profile adjustments.'
    : '냉장고 식재료 기반 맞춤 레시피 추천. 영수증 OCR로 자동 등록, 2구 병렬 조리 타이머, 미각 프로파일 맞춤 간 조절.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: isEn ? 'FlavorSync' : '플레이버 싱크',
  },
  openGraph: {
    title: isEn ? 'FlavorSync' : '플레이버 싱크',
    description: isEn
      ? "What to cook with what's in your fridge? AI recommends recipes for you."
      : '내 냉장고 재료로 오늘 뭐 먹지? AI가 레시피를 추천해 드립니다.',
    type: 'website',
    locale: isEn ? 'en_US' : 'ko_KR',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  robots: { index: true, follow: true },
  other: {
    'naver-site-verification': 'baeb20d1eeade686507962cba56aad0e40e7fccf',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={isEn ? 'en' : 'ko'}>
      <body>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-L0JSVRCG0B" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-L0JSVRCG0B');
        `}</Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
