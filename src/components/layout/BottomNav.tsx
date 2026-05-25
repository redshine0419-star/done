'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { path: '/fridge',  label: '냉장고', icon: '🧊' },
  { path: '/taste',   label: '미각',   icon: '❤️' },
  { path: '/recipe',  label: '레시피', icon: '🍳' },
  { path: '/blog',    label: '블로그', icon: '📝' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe max-w-md mx-auto">
      <div className="flex justify-around items-stretch h-16">
        {NAV.map(({ path, label, icon }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              aria-label={label}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors ${
                isActive ? 'text-[#FF6B35]' : 'text-gray-400'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
