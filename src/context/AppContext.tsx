'use client';
import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { FridgeItem, TasteProfile, Recipe, CookSession, AdjustedIngredient } from '@/types';
import { mockFridgeItems } from '@/data/mockFridge';
import { loadFromLS, saveToLS, migrateFridgeItemsV1 } from '@/utils/storage';

interface AppState {
  fridgeItems: FridgeItem[];
  tasteProfile: TasteProfile;
  activeCookRecipe: Recipe | null;
  cookSession: CookSession | null;
  favoriteIds: string[];
}

type AppAction =
  | { type: 'ADD_FRIDGE_ITEM'; payload: FridgeItem }
  | { type: 'EDIT_FRIDGE_ITEM'; payload: FridgeItem }
  | { type: 'REMOVE_FRIDGE_ITEM'; payload: { id: string } }
  | { type: 'LOAD_SAMPLE_DATA' }
  | { type: 'DEDUCT_INGREDIENTS'; payload: AdjustedIngredient[] }
  | { type: 'UPDATE_TASTE'; payload: TasteProfile }
  | { type: 'START_COOKING'; payload: Recipe }
  | { type: 'TICK_COOK'; payload: { b1Elapsed: number; b2Elapsed: number } }
  | { type: 'ADVANCE_COOK_STEP'; payload: { burner: 1 | 2 } }
  | { type: 'PAUSE_COOKING' }
  | { type: 'RESUME_COOKING' }
  | { type: 'COMPLETE_COOKING' }
  | { type: 'RESET_COOKING' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_FAVORITES'; payload: string[] };

function burnerSteps(recipe: Recipe, burner: 1 | 2) {
  const allNull = recipe.steps.every(s => s.burner === null);
  if (allNull) return burner === 1 ? recipe.steps : [];
  // null-burner (prep/rest) steps belong to burner 1 so they are never dropped
  return recipe.steps.filter(s => s.burner === burner || (burner === 1 && s.burner === null));
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FRIDGE_ITEM':
      return { ...state, fridgeItems: [...state.fridgeItems, action.payload] };

    case 'EDIT_FRIDGE_ITEM':
      return { ...state, fridgeItems: state.fridgeItems.map(i => i.ingredient_id === action.payload.ingredient_id ? action.payload : i) };

    case 'REMOVE_FRIDGE_ITEM':
      return { ...state, fridgeItems: state.fridgeItems.filter(i => i.ingredient_id !== action.payload.id) };

    case 'LOAD_SAMPLE_DATA':
      return { ...state, fridgeItems: mockFridgeItems };

    case 'DEDUCT_INGREDIENTS': {
      const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
      const updated = state.fridgeItems.map(item => {
        const deduction = action.payload.find(d => {
          if (d.ingredient_id === item.ingredient_id) return true;
          const dn = norm(d.name), fn = norm(item.name);
          if (dn.length < 2 || fn.length < 2) return false;
          return dn === fn || dn.includes(fn) || fn.includes(dn);
        });
        if (!deduction) return item;
        return { ...item, amount: parseFloat(Math.max(0, item.amount - deduction.adjustedAmount).toFixed(2)) };
      });
      return { ...state, fridgeItems: updated };
    }

    case 'UPDATE_TASTE':
      return { ...state, tasteProfile: action.payload };

    case 'START_COOKING': {
      const recipe = action.payload;
      const now = performance.now();
      return {
        ...state,
        activeCookRecipe: recipe,
        cookSession: {
          burner1StepIndex: 0,
          burner2StepIndex: recipe.isCombo ? 0 : -1,
          burner1StepStartMs: now,
          burner2StepStartMs: recipe.isCombo ? now : -1,
          pausedAt: null,
          pausedDuration: 0,
          isRunning: true,
          isComplete: false,
        },
      };
    }

    case 'TICK_COOK': {
      const { cookSession: cs, activeCookRecipe: recipe } = state;
      if (!cs || !cs.isRunning || cs.isComplete || !recipe) return state;

      const { b1Elapsed, b2Elapsed } = action.payload;
      const b1Steps = burnerSteps(recipe, 1);
      const b2Steps = burnerSteps(recipe, 2);

      let { burner1StepIndex, burner2StepIndex } = cs;
      const now = performance.now();

      // Auto-advance burner 1
      if (burner1StepIndex < b1Steps.length && b1Elapsed >= b1Steps[burner1StepIndex].duration_sec) {
        burner1StepIndex += 1;
      }
      // Auto-advance burner 2
      if (burner2StepIndex >= 0 && burner2StepIndex < b2Steps.length && b2Elapsed >= b2Steps[burner2StepIndex].duration_sec) {
        burner2StepIndex += 1;
      }

      const b1Done = burner1StepIndex >= b1Steps.length;
      const b2Done = burner2StepIndex < 0 || burner2StepIndex >= b2Steps.length;
      const isComplete = b1Done && b2Done;

      // Reset step start timestamps on auto-advance
      const newB1StartMs = burner1StepIndex !== cs.burner1StepIndex ? now : cs.burner1StepStartMs;
      const newB2StartMs = burner2StepIndex !== cs.burner2StepIndex ? now : cs.burner2StepStartMs;

      return {
        ...state,
        cookSession: {
          ...cs,
          burner1StepIndex,
          burner2StepIndex,
          burner1StepStartMs: newB1StartMs,
          burner2StepStartMs: newB2StartMs,
          isComplete,
          isRunning: !isComplete,
        },
      };
    }

    case 'ADVANCE_COOK_STEP': {
      if (!state.cookSession || !state.activeCookRecipe) return state;
      const cs = state.cookSession;
      const recipe = state.activeCookRecipe;
      const b1Steps = burnerSteps(recipe, 1);
      const b2Steps = burnerSteps(recipe, 2);
      const now = performance.now();

      if (action.payload.burner === 1) {
        const next = Math.min(cs.burner1StepIndex + 1, b1Steps.length);
        const b2Done = cs.burner2StepIndex < 0 || cs.burner2StepIndex >= b2Steps.length;
        const isComplete = next >= b1Steps.length && b2Done;
        return { ...state, cookSession: { ...cs, burner1StepIndex: next, burner1StepStartMs: now, isComplete, isRunning: !isComplete } };
      } else {
        const next = Math.min(cs.burner2StepIndex + 1, b2Steps.length);
        const b1Done = cs.burner1StepIndex >= b1Steps.length;
        const isComplete = b1Done && next >= b2Steps.length;
        return { ...state, cookSession: { ...cs, burner2StepIndex: next, burner2StepStartMs: now, isComplete, isRunning: !isComplete } };
      }
    }

    case 'PAUSE_COOKING':
      if (!state.cookSession) return state;
      return { ...state, cookSession: { ...state.cookSession, isRunning: false, pausedAt: performance.now() } };

    case 'RESUME_COOKING': {
      if (!state.cookSession) return state;
      const cs = state.cookSession;
      const extraPause = cs.pausedAt ? performance.now() - cs.pausedAt : 0;
      return { ...state, cookSession: { ...cs, isRunning: true, pausedAt: null, pausedDuration: cs.pausedDuration + extraPause } };
    }

    case 'COMPLETE_COOKING':
      if (!state.cookSession) return state;
      return { ...state, cookSession: { ...state.cookSession, isComplete: true, isRunning: false } };

    case 'RESET_COOKING':
      return { ...state, activeCookRecipe: null, cookSession: null };

    case 'TOGGLE_FAVORITE': {
      const id = action.payload;
      const exists = state.favoriteIds.includes(id);
      return { ...state, favoriteIds: exists ? state.favoriteIds.filter(f => f !== id) : [...state.favoriteIds, id] };
    }

    case 'SET_FAVORITES':
      return { ...state, favoriteIds: action.payload };

    default:
      return state;
  }
}

const defaultTaste: TasteProfile = { spicy: 2, sweet: 2, salty: 2 };

function initState(): AppState {
  const rawFridge = loadFromLS<unknown[]>('fs_fridge', []);
  const fridgeItems = rawFridge.length > 0
    ? migrateFridgeItemsV1(rawFridge)
    : [];

  return {
    fridgeItems,
    tasteProfile: loadFromLS<TasteProfile>('fs_taste', defaultTaste),
    activeCookRecipe: loadFromLS<Recipe | null>('fs_cook_recipe', null),
    cookSession: loadFromLS<CookSession | null>('fs_cook_session', null),
    favoriteIds: loadFromLS<string[]>('fs_favorites', []),
  };
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { data: session, status } = useSession();

  // Track which LS key is currently active for favorites (user-scoped when logged in)
  const favKeyRef = useRef<string>('fs_favorites');

  useEffect(() => {
    if (status === 'loading') return;
    const newKey = session?.user?.id ? `fs_favorites_${session.user.id}` : 'fs_favorites';
    if (newKey !== favKeyRef.current) {
      favKeyRef.current = newKey;
      dispatch({ type: 'SET_FAVORITES', payload: loadFromLS<string[]>(newKey, []) });
    }
  }, [status, session?.user?.id]);

  useEffect(() => { saveToLS('fs_fridge', state.fridgeItems); }, [state.fridgeItems]);
  useEffect(() => { saveToLS('fs_taste', state.tasteProfile); }, [state.tasteProfile]);
  useEffect(() => { saveToLS('fs_cook_recipe', state.activeCookRecipe); }, [state.activeCookRecipe]);
  useEffect(() => { saveToLS('fs_cook_session', state.cookSession); }, [state.cookSession]);
  useEffect(() => { saveToLS(favKeyRef.current, state.favoriteIds); }, [state.favoriteIds]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
