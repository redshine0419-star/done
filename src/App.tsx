import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { CookFAB } from '@/components/layout/CookFAB';
import { FridgeScreen } from '@/screens/FridgeScreen';
import { TasteScreen } from '@/screens/TasteScreen';
import { BlogScreen } from '@/screens/BlogScreen';
import { RecipesScreen } from '@/screens/RecipesScreen';
import { CookScreen } from '@/screens/CookScreen';
import { MagazineScreen } from '@/screens/MagazineScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import type { ScreenId } from '@/types';

const SCREEN_META: Record<ScreenId, { title: string; description: string }> = {
  fridge:   { title: '스마트 냉장고 — 플레이버 싱크', description: '냉장고 식재료를 등록하고 유통기한을 관리하세요. 보유 재료 기반 맞춤 레시피를 추천받을 수 있어요.' },
  taste:    { title: '미각 프로파일 — 플레이버 싱크', description: '나만의 미각 프로파일을 설정하면 짠맛·단맛·매운맛이 자동으로 조절된 레시피를 제공합니다.' },
  blog:     { title: '오늘의 레시피 — 플레이버 싱크', description: '김치찌개·된장찌개·제육볶음 등 인기 한식 레시피를 냉장고 재료 기반으로 검색하세요.' },
  recipes:  { title: '냉장고 맞춤 레시피 — 플레이버 싱크', description: '보유 식재료 비율이 높은 레시피 순으로 추천. 2구 병렬 조리로 최대 47% 시간을 절약하세요.' },
  cook:     { title: '조리 모드 — 플레이버 싱크', description: '2구 병렬 타이머로 메인 요리와 국을 동시에 완성하세요. 간트 차트로 타이밍을 시각화합니다.' },
  magazine: { title: '푸드 매거진 — 플레이버 싱크', description: '마늘 알리신, 된장 발효 과학, 잡채 황금 비율 등 음식 과학과 요리 지식을 담은 아티클.' },
};

const params = new URLSearchParams(window.location.search);
const isAdmin = params.get('admin') === '1';
const initialScreen = (params.get('screen') as ScreenId) || null;

const SCREENS: Record<ScreenId, React.ReactNode> = {
  fridge:   <FridgeScreen />,
  taste:    <TasteScreen />,
  blog:     <BlogScreen />,
  recipes:  <RecipesScreen />,
  cook:     <CookScreen />,
  magazine: <MagazineScreen />,
};

const VALID_SCREENS: ScreenId[] = ['fridge', 'taste', 'blog', 'recipes', 'cook', 'magazine'];

export function App() {
  const { state, dispatch } = useApp();

  // URL 파라미터로 딥링크 처리 (초기 1회)
  useEffect(() => {
    if (initialScreen && VALID_SCREENS.includes(initialScreen)) {
      dispatch({ type: 'NAVIGATE', payload: initialScreen });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 화면 전환 시 meta 태그 업데이트 (SEO + 공유 최적화)
  useEffect(() => {
    const meta = SCREEN_META[state.activeScreen];
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.description);
    // URL 쿼리 파라미터 업데이트 (딥링크 지원)
    const url = new URL(window.location.href);
    url.searchParams.set('screen', state.activeScreen);
    window.history.replaceState(null, '', url.toString());
  }, [state.activeScreen]);

  if (isAdmin) return <AdminScreen />;

  return (
    <div className="relative min-h-full max-w-md mx-auto bg-gray-50">
      {SCREENS[state.activeScreen]}
      <BottomNav
        active={state.activeScreen}
        onNavigate={(s: ScreenId) => dispatch({ type: 'NAVIGATE', payload: s })}
      />
      <CookFAB
        isActive={state.cookSession !== null}
        isRunning={state.cookSession?.isRunning ?? false}
        onNavigate={() => dispatch({ type: 'NAVIGATE', payload: 'cook' })}
      />
    </div>
  );
}
