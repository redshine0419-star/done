'use client';
import { useState } from 'react';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLock';
import { t } from '@/i18n';

export function WakeLockToggle() {
  const [active, setActive] = useState(false);

  async function toggle() {
    if (active) {
      await releaseWakeLock();
      setActive(false);
    } else {
      const ok = await requestWakeLock();
      setActive(ok);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold touch-manipulation transition-colors ${
        active ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-500 border border-gray-200'
      }`}
    >
      <span>{active ? '💡' : '🌙'}</span>
      <span>{active ? t.cook.screenOn : t.cook.screenOff}</span>
    </button>
  );
}
