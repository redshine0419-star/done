import type { Metadata } from 'next';
import { TasteScreen } from '@/screens/TasteScreen';

export const metadata: Metadata = {
  title: '미각 프로파일 — 플레이버 싱크',
  description: '나만의 미각 프로파일을 설정하면 짠맛·단맛·매운맛이 자동으로 조절된 레시피를 제공합니다.',
};

export default function TastePage() {
  return <TasteScreen />;
}
