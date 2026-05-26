import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  noPad?: boolean;
  action?: ReactNode;
}

export function ScreenWrapper({ title, subtitle, children, noPad, action }: Props) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 px-5 pt-5 pb-4"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-1)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13px] mt-0.5 font-medium" style={{ color: 'var(--text-3)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 pt-0.5">{action}</div>}
        </div>
      </header>
      <main className={`flex-1 max-w-5xl mx-auto w-full pb-24 md:pb-10 ${noPad ? '' : 'px-4 pt-4'}`}>
        {children}
      </main>
    </div>
  );
}
