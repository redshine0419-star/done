'use client';
import { AlertTriangle } from 'lucide-react';
import type { FridgeItem } from '@/types';
import { getDaysUntilExpiry } from '@/utils/expiry';

interface Props { items: FridgeItem[]; }

export function ExpiryAlert({ items }: Props) {
  const urgent = items
    .map(i => ({ ...i, days: getDaysUntilExpiry(i.expire_date) }))
    .filter(i => i.days <= 3)
    .sort((a, b) => a.days - b.days);

  if (urgent.length === 0) return null;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--amber-light)', border: '1px solid #F4C97A' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={15} color="var(--amber)" strokeWidth={2.5} />
        <p className="text-[13px] font-bold" style={{ color: 'var(--amber)' }}>유통기한 임박</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {urgent.map(item => (
          <span
            key={item.ingredient_id}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-surface"
            style={{ color: 'var(--text-1)', border: '1px solid var(--border)' }}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
            <span className="font-black" style={{ color: 'var(--amber)' }}>
              {item.days === 0 ? 'D-DAY' : `D-${item.days}`}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
