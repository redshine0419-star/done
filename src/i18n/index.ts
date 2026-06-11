'use client';
import { createContext, useContext } from 'react';
import { ko } from './ko';
import { en } from './en';

export type { Locale, Translations } from './shared';
export { locale, isEn, t, getT } from './shared';

export const LangContext = createContext<'ko' | 'en'>('ko');

export function useLang(): 'ko' | 'en' {
  return useContext(LangContext);
}

export function useT() {
  const lang = useContext(LangContext);
  return lang === 'en' ? en : ko;
}
