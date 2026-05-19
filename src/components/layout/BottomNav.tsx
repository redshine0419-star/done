import { SCREEN_NAV } from '@/constants/taste';
import type { ScreenId } from '@/types';

interface Props {
  active: ScreenId;
  onNavigate: (s: ScreenId) => void;
}

export function BottomNav({ active, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-stretch h-16">
        {SCREEN_NAV.map(({ id, label, icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id as ScreenId)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors ${
                isActive ? 'text-[#FF6B35]' : 'text-gray-400'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className={`text-[9px] font-semibold leading-none ${isActive ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
