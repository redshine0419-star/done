import { createContext, useContext } from 'react';
import { ko } from './ko';
import { en } from './en';

export type Locale = 'ko' | 'en';

// Build-time fallback (used in metadata, server components)
export const locale = (process.env.NEXT_PUBLIC_LOCALE || 'ko') as Locale;
export const isEn = locale === 'en';
export const t = isEn ? en : ko;

// Runtime context for client components
export const LangContext = createContext<Locale>(locale);

export function useLang(): Locale {
  return useContext(LangContext);
}

export function useT() {
  const lang = useContext(LangContext);
  return lang === 'en' ? en : ko;
}

export function getT(lang: Locale) {
  return lang === 'en' ? en : ko;
}

export type { Translations } from './types';
