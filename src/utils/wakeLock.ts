let sentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator) {
      sentinel = await navigator.wakeLock.request('screen');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    if (sentinel) {
      await sentinel.release();
      sentinel = null;
    }
  } catch {
    // ignore
  }
}

export function isWakeLockActive(): boolean {
  return sentinel !== null && !sentinel.released;
}
