'use client';
import { Pencil, Trash2 } from 'lucide-react';
import type { FridgeItem } from '@/types';
import { getDaysUntilExpiry } from '@/utils/expiry';
import { t } from '@/i18n';

interface Props {
  item: FridgeItem;
  onEdit: (item: FridgeItem) => void;
  onDelete: (id: string) => void;
}

function ExpiryBadge({ days }: { days: number }) {
  if (days < 0)  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>{t.fridge.expired}</span>;
  if (days === 0) return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>D-DAY</span>;
  if (days <= 3)  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>D-{days}</span>;
  if (days <= 7)  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF9E8', color: '#92740A' }}>D-{days}</span>;
  return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--text-3)' }}>D-{days}</span>;
}

export function IngredientCard({ item, onEdit, onDelete }: Props) {
  const days = getDaysUntilExpiry(item.expire_date);

  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-surface"
         style={{ border: '1px solid var(--border)' }}>
      <span className="text-xl w-7 text-center shrink-0 select-none">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--text-1)' }}>{item.name}</p>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>{item.amount} {item.unit}</p>
      </div>
      <ExpiryBadge days={days} />
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(item)}
          aria-label={t.common.edit}
          className="w-8 h-8 flex items-center justify-center rounded-xl touch-manipulation transition-colors hover:bg-app"
        >
          <Pencil size={15} color="var(--text-3)" strokeWidth={2} />
        </button>
        <button
          onClick={() => onDelete(item.ingredient_id)}
          aria-label={t.common.delete}
          className="w-8 h-8 flex items-center justify-center rounded-xl touch-manipulation transition-colors hover:bg-app"
        >
          <Trash2 size={15} color="var(--text-3)" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
