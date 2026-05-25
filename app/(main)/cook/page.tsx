import type { Metadata } from 'next';
import { CookScreen } from '@/screens/CookScreen';

export const metadata: Metadata = {
  title: '조리 모드 — 플레이버 싱크',
  description: '2구 병렬 타이머로 메인 요리와 국을 동시에 완성하세요.',
};

export default function CookPage() {
  return <CookScreen />;
}
