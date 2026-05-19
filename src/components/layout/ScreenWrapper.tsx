import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  noPad?: boolean;
}

export function ScreenWrapper({ title, subtitle, children, noPad }: Props) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 pt-4 pb-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </header>
      <main className={`flex-1 pb-20 ${noPad ? '' : 'px-4 pt-4'}`}>
        {children}
      </main>
    </div>
  );
}
