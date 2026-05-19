import { useState } from 'react';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLock';

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
      <span>{active ? '화면 켜짐 유지 중' : '화면 자동 꺼짐'}</span>
    </button>
  );
}
