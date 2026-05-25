import type { Metadata } from 'next';
import { FridgeScreen } from '@/screens/FridgeScreen';

export const metadata: Metadata = {
  title: '스마트 냉장고 — 플레이버 싱크',
  description: '냉장고 식재료를 등록하고 유통기한을 관리하세요. 영수증 OCR로 자동 등록 가능.',
};

export default function FridgePage() {
  return <FridgeScreen />;
}
