import { ko } from './ko';
import { en } from './en';

export type Locale = 'ko' | 'en';

export const locale = (process.env.NEXT_PUBLIC_LOCALE || 'ko') as Locale;
export const isEn = locale === 'en';
export const t = isEn ? en : ko;

export type { Translations } from './types';
