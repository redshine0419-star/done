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

const SCREENS: Record<ScreenId, React.ReactNode> = {
  fridge:   <FridgeScreen />,
  taste:    <TasteScreen />,
  blog:     <BlogScreen />,
  recipes:  <RecipesScreen />,
  cook:     <CookScreen />,
  magazine: <MagazineScreen />,
};

const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';

export function App() {
  const { state, dispatch } = useApp();

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
