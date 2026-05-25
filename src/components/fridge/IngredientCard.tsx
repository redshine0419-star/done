import type { FridgeItem } from '@/types';
import { getDaysUntilExpiry } from '@/utils/expiry';

interface Props {
  item: FridgeItem;
  onEdit: (item: FridgeItem) => void;
  onDelete: (id: string) => void;
}

function expiryColor(days: number) {
  if (days <= 1) return 'text-red-500';
  if (days <= 3) return 'text-orange-500';
  if (days <= 7) return 'text-yellow-600';
  return 'text-gray-400';
}

export function IngredientCard({ item, onEdit, onDelete }: Props) {
  const days = getDaysUntilExpiry(item.expire_date);
  const label = days === 0 ? 'D-DAY' : days < 0 ? '만료' : `D-${days}`;

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
      <span className="text-2xl w-8 text-center shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{item.amount} {item.unit}</p>
      </div>
      <span className={`text-xs font-bold shrink-0 ${expiryColor(days)}`}>{label}</span>
      <button
        onClick={() => onEdit(item)}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-blue-400 hover:bg-blue-50 transition-colors touch-manipulation"
        aria-label="수정"
      >
        ✎
      </button>
      <button
        onClick={() => onDelete(item.ingredient_id)}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors touch-manipulation"
        aria-label="삭제"
      >
        ✕
      </button>
    </div>
  );
}
