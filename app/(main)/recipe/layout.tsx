import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '레시피 — 플레이버 싱크',
  description: '냉장고 재료로 만드는 맞춤 레시피. 1구·2구 병렬 조리, 베이킹까지 AI가 추천해 드립니다.',
  openGraph: {
    title: '레시피 — 플레이버 싱크',
    description: '냉장고 재료로 만드는 맞춤 레시피. 1구·2구 병렬 조리, 베이킹까지.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '레시피 — 플레이버 싱크',
    description: '냉장고 재료로 만드는 맞춤 레시피',
  },
};

export default function RecipeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
