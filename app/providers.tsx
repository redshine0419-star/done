'use client';
import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '@/context/AppContext';
import { LangProvider } from '@/components/LangProvider';
import type { Locale } from '@/i18n';

export function Providers({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LangProvider lang={lang}>
        <AppProvider>{children}</AppProvider>
      </LangProvider>
    </SessionProvider>
  );
}
