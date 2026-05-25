'use client';
import { useState, useEffect, useMemo } from 'react';
import { mockRecipes } from '@/data/mockRecipes';
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
    const mockIds = new Set(mockRecipes.map(r => r.id));
    const extras = dbRecipes.filter(r => !mockIds.has(r.id));
    return [...mockRecipes, ...extras];
  }, [dbRecipes]);
}
