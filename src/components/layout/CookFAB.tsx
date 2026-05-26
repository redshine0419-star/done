'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Timer } from 'lucide-react';

export function CookFAB() {
  const { state } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const { cookSession: cs } = state;
  if (!cs || pathname === '/cook') return null;

  return (
    <button
      onClick={() => router.push('/cook')}
      aria-label="조리 화면으로 이동"
      className="fixed bottom-[76px] md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center touch-manipulation transition-all active:scale-95"
      style={{
        background: 'var(--brand)',
        boxShadow: cs.isRunning
          ? '0 0 0 4px rgba(201,75,42,0.25), 0 4px 16px rgba(201,75,42,0.4)'
          : '0 4px 16px rgba(0,0,0,0.18)',
      }}
    >
      <Timer size={24} color="white" strokeWidth={2} />
      {cs.isRunning && (
        <span className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(201,75,42,0.3)' }} />
      )}
    </button>
  );
}
