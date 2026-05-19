import type { FridgeItem } from '@/types';

interface Props {
  items: FridgeItem[];
}

const EXPIRY_STYLE: Record<number, string> = {
  0: 'bg-red-100 text-red-700 border-red-300',
  1: 'bg-orange-100 text-orange-700 border-orange-300',
  2: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  3: 'bg-lime-100 text-lime-700 border-lime-300',
};

export function ExpiryAlert({ items }: Props) {
  const urgent = items.filter(i => i.expire_days <= 3).sort((a, b) => a.expire_days - b.expire_days);
  if (urgent.length === 0) return null;

  return (
    <div className="rounded-2xl bg-red-50 border border-red-200 p-3">
      <p className="text-sm font-bold text-red-600 mb-2">⚠️ 유통기한 임박 식재료</p>
      <div className="flex flex-wrap gap-2">
        {urgent.map(item => {
          const style = EXPIRY_STYLE[item.expire_days] ?? EXPIRY_STYLE[3];
          const label = item.expire_days === 0 ? 'D-DAY' : `D-${item.expire_days}`;
          return (
            <span key={item.ingredient_id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
              {item.icon} {item.name}
              <span className="font-black">{label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
