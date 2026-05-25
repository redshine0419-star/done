import type { FridgeItem } from '@/types';
import { expireDateFromDays } from '@/utils/expiry';

export function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToLS<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

// 구버전 expire_days(number) → expire_date(ISO string) 마이그레이션
export function migrateFridgeItemsV1(items: unknown[]): FridgeItem[] {
  return (items as unknown[]).map(item => {
    const obj = item as Record<string, unknown>;
    if ('expire_days' in obj && !('expire_date' in obj)) {
      const { expire_days, ...rest } = obj;
      return { ...rest, expire_date: expireDateFromDays(expire_days as number) } as FridgeItem;
    }
    return item as FridgeItem;
  });
}
