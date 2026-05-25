'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export function CookFAB() {
  const { state } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const { cookSession: cs } = state;
  if (!cs || pathname === '/cook') return null;

  return (
    <button
      onClick={() => router.push('/cook')}
      className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[#FF6B35] text-white text-2xl shadow-lg flex items-center justify-center touch-manipulation transition-transform active:scale-95 ${
        cs.isRunning ? 'ring-4 ring-orange-300 ring-offset-2 animate-pulse' : ''
      }`}
      aria-label="조리 화면으로 이동"
    >
      ⏱
    </button>
  );
}
