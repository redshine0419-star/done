'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Already installed or dismissed
    if (localStorage.getItem('pwa-banner-dismissed')) return;
    // Already running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as { standalone?: boolean }).standalone;
    if (ios) { setIsIos(true); setShow(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem('pwa-banner-dismissed', '1');
    setShow(false);
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-[90] px-3 max-w-md mx-auto">
      <div className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
           style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="text-2xl shrink-0">📱</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-1)' }}>
            홈화면에 추가하면 더 편해요
          </p>
          {isIos ? (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
              Safari 하단 공유 버튼 → &quot;홈 화면에 추가&quot;
            </p>
          ) : (
            <button onClick={install}
                    className="text-[11px] font-bold mt-0.5 touch-manipulation"
                    style={{ color: 'var(--brand)' }}>
              지금 설치하기 →
            </button>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 touch-manipulation p-1">
          <X size={16} color="var(--text-3)" />
        </button>
      </div>
    </div>
  );
}
