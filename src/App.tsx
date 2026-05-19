import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { FridgeScreen } from '@/screens/FridgeScreen';
import { TasteScreen } from '@/screens/TasteScreen';
import { BlogScreen } from '@/screens/BlogScreen';
import { RecipesScreen } from '@/screens/RecipesScreen';
import { CookScreen } from '@/screens/CookScreen';
import type { ScreenId } from '@/types';

const SCREENS: Record<ScreenId, React.ReactNode> = {
  fridge:  <FridgeScreen />,
  taste:   <TasteScreen />,
  blog:    <BlogScreen />,
  recipes: <RecipesScreen />,
  cook:    <CookScreen />,
};

export function App() {
  const { state, dispatch } = useApp();

  return (
    <div className="relative min-h-full max-w-md mx-auto bg-gray-50">
      {SCREENS[state.activeScreen]}
      <BottomNav
        active={state.activeScreen}
        onNavigate={(s: ScreenId) => dispatch({ type: 'NAVIGATE', payload: s })}
      />
    </div>
  );
}
