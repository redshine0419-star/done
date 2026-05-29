'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Refrigerator, UtensilsCrossed, BookOpen } from 'lucide-react';

const NAV = [
  { path: '/fridge',  label: '냉장고', Icon: Refrigerator },
  { path: '/recipe',  label: '레시피', Icon: UtensilsCrossed },
  { path: '/blog',    label: '블로그', Icon: BookOpen },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto pb-safe"
         style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
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
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--brand)]" />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
                color={isActive ? 'var(--brand)' : 'var(--text-3)'}
              />
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ color: isActive ? 'var(--brand)' : 'var(--text-3)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
