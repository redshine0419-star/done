export interface FridgeItem {
  ingredient_id: string;
  name: string;
  amount: number;
  unit: string;
  expire_date: string;   // ISO date "2026-05-21" — replaces expire_days
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

export interface CookSession {
  burner1StepIndex: number;
  burner2StepIndex: number;
  burner1StepStartMs: number;   // performance.now() 기준
  burner2StepStartMs: number;
  pausedAt: number | null;
  pausedDuration: number;
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

export type BlogCategory = '요리팁' | '식재료이야기' | '건강식' | '시즌레시피' | '미각탐구';

export interface BlogPost {
  id: string;
  title: string;
  category: BlogCategory;
  thumbnail: string;
  summary: string;
  body: string;            // 마크다운
  author: string;
  published_at: string;
  tags: string[];
  readTime: number;
  related_recipe_id?: string;
}
