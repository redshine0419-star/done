import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { TasteSlider } from '@/components/taste/TasteSlider';
import { GValuePreview } from '@/components/taste/GValuePreview';
import { useApp } from '@/context/AppContext';

export function TasteScreen() {
  const { state, dispatch } = useApp();
  const { tasteProfile } = state;

  function update(key: 'spicy' | 'sweet' | 'salty', val: 1 | 2 | 3) {
    dispatch({ type: 'UPDATE_TASTE', payload: { ...tasteProfile, [key]: val } });
  }

  return (
    <ScreenWrapper title="❤️ 미각 매트릭스" subtitle="내 입맛에 맞게 레시피를 자동 조정합니다">
      <div className="space-y-4">
        <TasteSlider
          label="맵기 강도"
          emoji="🌶️"
          value={tasteProfile.spicy}
          onChange={v => update('spicy', v)}
          color="bg-red-500 text-white"
        />
        <TasteSlider
          label="단맛 조절"
          emoji="🍯"
          value={tasteProfile.sweet}
          onChange={v => update('sweet', v)}
          color="bg-yellow-400 text-white"
        />
        <TasteSlider
          label="염도 강도"
          emoji="🧂"
          value={tasteProfile.salty}
          onChange={v => update('salty', v)}
          color="bg-blue-500 text-white"
        />

        <GValuePreview tasteProfile={tasteProfile} />

        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <p className="text-xs font-bold text-orange-700 mb-1">미각 공식</p>
          <p className="text-xs text-orange-600">
            조정량 = 기본량 × 가중치 × (인분 ÷ 2)<br />
            약하게 × 0.6 · 보통 × 1.0 · 강하게 × 1.6
          </p>
        </div>
      </div>
    </ScreenWrapper>
  );
}
