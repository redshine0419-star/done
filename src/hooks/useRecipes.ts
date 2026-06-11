'use client';
import { useState, useEffect, useMemo } from 'react';
import { mockRecipes } from '@/data/mockRecipes';
import { mockRecipesEn } from '@/data/mockRecipesEn';
import { isEn } from '@/i18n';
import type { Recipe } from '@/types';

export function useRecipes(): Recipe[] {
  const [dbRecipes, setDbRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetch('/api/recipes')
      .then(r => r.json())
      .then((rows: Recipe[]) => {
        if (Array.isArray(rows)) setDbRecipes(rows);
      })
      .catch(() => {});
  }, []);

  return useMemo(() => {
    const base = isEn ? mockRecipesEn : mockRecipes;
    const mockIds = new Set(base.map(r => r.id));
    const extras = dbRecipes.filter(r => !mockIds.has(r.id));
    return [...base, ...extras];
  }, [dbRecipes]);
}
