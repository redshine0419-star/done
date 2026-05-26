import type { FridgeItem, RecipeIngredient } from '@/types';

function norm(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

export function ingredientMatches(fridge: FridgeItem, recipeIng: RecipeIngredient): boolean {
  // Exact ID match (mock recipes + mock fridge)
  if (fridge.ingredient_id === recipeIng.ingredient_id) return true;
  // Name match (DB recipes or user-added fridge items)
  const fn = norm(fridge.name);
  const rn = norm(recipeIng.name);
  if (fn.length < 2 || rn.length < 2) return false;
  return fn === rn || fn.includes(rn) || rn.includes(fn);
}

export function getMatchRate(recipe: { ingredients: RecipeIngredient[] }, fridgeItems: FridgeItem[]): number {
  const mains = recipe.ingredients.filter(i => i.type === 'main');
  if (mains.length === 0) return 100;
  const have = mains.filter(ing => fridgeItems.some(f => ingredientMatches(f, ing))).length;
  return Math.round((have / mains.length) * 100);
}
