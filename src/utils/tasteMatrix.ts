import { TASTE_WEIGHTS } from '@/constants/taste';
import type { RecipeIngredient, TasteProfile } from '@/types';

export function adjustedAmount(
  base: number,
  type: RecipeIngredient['type'],
  tasteLevel: 1 | 2 | 3,
  servings: number,
): number {
  const weight = type === 'main' ? 1.0 : TASTE_WEIGHTS[tasteLevel];
  return parseFloat((base * weight * (servings / 2)).toFixed(2));
}

export function getRelevantTasteLevel(
  type: RecipeIngredient['type'],
  tasteDimension: 'spicy' | 'sweet' | 'salty',
  tasteProfile: TasteProfile,
): 1 | 2 | 3 {
  if (type === 'main') return 2;
  // Map ingredient types to taste dimensions heuristically
  return tasteProfile[tasteDimension];
}

// Pick the dominant taste dimension for a seasoning ingredient name
export function dominantTasteLevel(name: string, tasteProfile: TasteProfile): 1 | 2 | 3 {
  if (['고추장', '고추', '청양', '홍고추', '고춧가루'].some(k => name.includes(k))) return tasteProfile.spicy;
  if (['설탕', '물엿', '꿀', '맛술', '미림'].some(k => name.includes(k))) return tasteProfile.sweet;
  if (['간장', '된장', '소금', '액젓', '새우젓', '참기름', '마늘'].some(k => name.includes(k))) return tasteProfile.salty;
  return tasteProfile.salty; // default
}
