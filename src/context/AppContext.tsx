import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { FridgeItem, TasteProfile, ScreenId, Recipe, CookSession, AdjustedIngredient } from '@/types';
import { mockFridgeItems } from '@/data/mockFridge';
import { loadFromLS, saveToLS } from '@/utils/storage';

interface AppState {
  fridgeItems: FridgeItem[];
  tasteProfile: TasteProfile;
  activeScreen: ScreenId;
  activeCookRecipe: Recipe | null;
  cookSession: CookSession | null;
}

type AppAction =
  | { type: 'ADD_FRIDGE_ITEM'; payload: FridgeItem }
  | { type: 'REMOVE_FRIDGE_ITEM'; payload: { id: string } }
  | { type: 'DEDUCT_INGREDIENTS'; payload: AdjustedIngredient[] }
  | { type: 'UPDATE_TASTE'; payload: TasteProfile }
  | { type: 'NAVIGATE'; payload: ScreenId }
  | { type: 'START_COOKING'; payload: Recipe }
  | { type: 'TICK_COOK' }
  | { type: 'ADVANCE_COOK_STEP'; payload: { burner: 1 | 2 } }
  | { type: 'PAUSE_COOKING' }
  | { type: 'RESUME_COOKING' }
  | { type: 'COMPLETE_COOKING' }
  | { type: 'RESET_COOKING' };

function burnerSteps(recipe: Recipe, burner: 1 | 2) {
  return recipe.steps.filter(s => s.burner === burner);
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FRIDGE_ITEM':
      return { ...state, fridgeItems: [...state.fridgeItems, action.payload] };

    case 'REMOVE_FRIDGE_ITEM':
      return { ...state, fridgeItems: state.fridgeItems.filter(i => i.ingredient_id !== action.payload.id) };

    case 'DEDUCT_INGREDIENTS': {
      const updated = state.fridgeItems.map(item => {
        const deduction = action.payload.find(d => d.ingredient_id === item.ingredient_id);
        if (!deduction) return item;
        return { ...item, amount: parseFloat(Math.max(0, item.amount - deduction.adjustedAmount).toFixed(2)) };
      });
      return { ...state, fridgeItems: updated };
    }

    case 'UPDATE_TASTE':
      return { ...state, tasteProfile: action.payload };

    case 'NAVIGATE':
      return { ...state, activeScreen: action.payload };

    case 'START_COOKING': {
      const recipe = action.payload;
      const hasCombo = recipe.isCombo;
      return {
        ...state,
        activeCookRecipe: recipe,
        activeScreen: 'cook',
        cookSession: {
          burner1StepIndex: 0,
          burner2StepIndex: hasCombo ? 0 : -1,
          burner1Elapsed: 0,
          burner2Elapsed: 0,
          isRunning: true,
          isComplete: false,
        },
      };
    }

    case 'TICK_COOK': {
      if (!state.cookSession || !state.cookSession.isRunning || state.cookSession.isComplete) return state;
      const { cookSession: cs, activeCookRecipe: recipe } = state;
      if (!recipe) return state;

      let { burner1StepIndex, burner2StepIndex, burner1Elapsed, burner2Elapsed } = cs;
      const b1Steps = burnerSteps(recipe, 1);
      const b2Steps = burnerSteps(recipe, 2);

      burner1Elapsed += 1;
      burner2Elapsed += 1;

      // Auto-advance burner1
      if (burner1StepIndex < b1Steps.length && burner1Elapsed >= b1Steps[burner1StepIndex].duration_sec) {
        burner1StepIndex += 1;
        burner1Elapsed = 0;
      }
      // Auto-advance burner2
      if (burner2StepIndex >= 0 && burner2StepIndex < b2Steps.length && burner2Elapsed >= b2Steps[burner2StepIndex].duration_sec) {
        burner2StepIndex += 1;
        burner2Elapsed = 0;
      }

      const b1Done = burner1StepIndex >= b1Steps.length;
      const b2Done = burner2StepIndex < 0 || burner2StepIndex >= b2Steps.length;
      const isComplete = b1Done && b2Done;

      return {
        ...state,
        cookSession: { ...cs, burner1StepIndex, burner2StepIndex, burner1Elapsed, burner2Elapsed, isComplete, isRunning: !isComplete },
      };
    }

    case 'ADVANCE_COOK_STEP': {
      if (!state.cookSession || !state.activeCookRecipe) return state;
      const cs = state.cookSession;
      const recipe = state.activeCookRecipe;
      const b1Steps = burnerSteps(recipe, 1);
      const b2Steps = burnerSteps(recipe, 2);

      if (action.payload.burner === 1) {
        const next = Math.min(cs.burner1StepIndex + 1, b1Steps.length);
        const b2Done = cs.burner2StepIndex < 0 || cs.burner2StepIndex >= b2Steps.length;
        const isComplete = next >= b1Steps.length && b2Done;
        return { ...state, cookSession: { ...cs, burner1StepIndex: next, burner1Elapsed: 0, isComplete, isRunning: !isComplete } };
      } else {
        const next = Math.min(cs.burner2StepIndex + 1, b2Steps.length);
        const b1Done = cs.burner1StepIndex >= b1Steps.length;
        const isComplete = b1Done && next >= b2Steps.length;
        return { ...state, cookSession: { ...cs, burner2StepIndex: next, burner2Elapsed: 0, isComplete, isRunning: !isComplete } };
      }
    }

    case 'PAUSE_COOKING':
      if (!state.cookSession) return state;
      return { ...state, cookSession: { ...state.cookSession, isRunning: false } };

    case 'RESUME_COOKING':
      if (!state.cookSession) return state;
      return { ...state, cookSession: { ...state.cookSession, isRunning: true } };

    case 'COMPLETE_COOKING':
      if (!state.cookSession) return state;
      return { ...state, cookSession: { ...state.cookSession, isComplete: true, isRunning: false } };

    case 'RESET_COOKING':
      return { ...state, activeCookRecipe: null, cookSession: null, activeScreen: 'blog' };

    default:
      return state;
  }
}

const defaultTaste: TasteProfile = { spicy: 2, sweet: 2, salty: 2 };

function initState(): AppState {
  return {
    fridgeItems: loadFromLS<FridgeItem[]>('fs_fridge', mockFridgeItems),
    tasteProfile: loadFromLS<TasteProfile>('fs_taste', defaultTaste),
    activeScreen: 'fridge',
    activeCookRecipe: null,
    cookSession: null,
  };
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => { saveToLS('fs_fridge', state.fridgeItems); }, [state.fridgeItems]);
  useEffect(() => { saveToLS('fs_taste', state.tasteProfile); }, [state.tasteProfile]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
