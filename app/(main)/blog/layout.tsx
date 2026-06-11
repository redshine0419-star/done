import type { Metadata } from 'next';
import { isEn } from '@/i18n';

export const metadata: Metadata = {
  title: isEn ? 'Blog — FlavorSync' : '블로그 — 플레이버 싱크',
  description: isEn
    ? 'Recipes, ingredients & the science of cooking. Tips to make cooking more enjoyable.'
    : '레시피·식재료·요리 과학 이야기. 요리가 더 즐거워지는 정보를 전합니다.',
  openGraph: {
    title: isEn ? 'Blog — FlavorSync' : '블로그 — 플레이버 싱크',
    description: isEn
      ? 'Recipes, ingredients & the science of cooking. Tips to make cooking more enjoyable.'
      : '레시피·식재료·요리 과학 이야기. 요리가 더 즐거워지는 정보를 전합니다.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: isEn ? 'Blog — FlavorSync' : '블로그 — 플레이버 싱크',
    description: isEn ? 'Recipes, ingredients & the science of cooking' : '레시피·식재료·요리 과학 이야기',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
