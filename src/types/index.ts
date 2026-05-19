export interface FridgeItem {
  ingredient_id: string;
  name: string;
  amount: number;
  unit: string;
  expire_days: number;
  icon: string;
  registered_at: string;
}

export interface TasteProfile {
  spicy: 1 | 2 | 3;
  sweet: 1 | 2 | 3;
  salty: 1 | 2 | 3;
}

export interface RecipeIngredient {
  ingredient_id: string;
  name: string;
  base_amount: number;
  unit: string;
  type: 'main' | 'seasoning' | 'garnish';
}

export interface RecipeStep {
  burner: 1 | 2 | null;
  action: string;
  duration_sec: number;
  description: string;
}

export interface Recipe {
  id: string;
  title: string;
  story: string;
  thumbnail: string;
  isCombo: boolean;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export type ScreenId = 'fridge' | 'taste' | 'blog' | 'recipes' | 'cook';

export interface CookSession {
  burner1StepIndex: number;
  burner2StepIndex: number;
  burner1Elapsed: number;
  burner2Elapsed: number;
  isRunning: boolean;
  isComplete: boolean;
}

export interface AdjustedIngredient {
  ingredient_id: string;
  name: string;
  adjustedAmount: number;
  unit: string;
}

export type VoiceCommand = 'next' | 'pause' | 'complete';
