'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Refrigerator, UtensilsCrossed, BookOpen } from 'lucide-react';

const NAV = [
  { path: '/fridge',  label: '냉장고', Icon: Refrigerator },
  { path: '/recipe',  label: '레시피', Icon: UtensilsCrossed },
  { path: '/blog',    label: '블로그', Icon: BookOpen },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
      >
        <div className="flex justify-around items-stretch h-[60px]">
          {NAV.map(({ path, label, Icon }) => {
            const isActive = pathname === path || pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                href={path}
                aria-label={label}
                className="flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation relative"
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                        style={{ background: 'var(--brand)' }} />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive ? 'var(--brand)' : 'var(--text-3)'}
                />
                <span className="text-[10px] font-semibold leading-none"
                      style={{ color: isActive ? 'var(--brand)' : 'var(--text-3)' }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: left sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] z-40 p-5"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <div className="mb-8 px-1">
          <p className="text-[17px] font-black tracking-tight" style={{ color: 'var(--brand)' }}>
            플레이버 싱크
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>AI 스마트 레시피</p>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV.map(({ path, label, Icon }) => {
            const isActive = pathname === path || pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                href={path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[14px] transition-colors touch-manipulation"
                style={{
                  background: isActive ? 'var(--brand-light)' : 'transparent',
                  color: isActive ? 'var(--brand)' : 'var(--text-2)',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8}
                      color={isActive ? 'var(--brand)' : 'var(--text-2)'} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-1 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            © 2026 플레이버 싱크
          </p>
        </div>
      </aside>
    </>
  );
}
