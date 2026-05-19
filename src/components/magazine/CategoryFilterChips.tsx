import type { BlogCategory } from '@/types';

const CATEGORIES: BlogCategory[] = ['요리팁', '식재료이야기', '건강식', '시즌레시피', '미각탐구'];

const CATEGORY_EMOJI: Record<BlogCategory, string> = {
  '요리팁': '💡',
  '식재료이야기': '🌿',
  '건강식': '💚',
  '시즌레시피': '🍂',
  '미각탐구': '👅',
};

interface Props {
  selected: BlogCategory | null;
  onChange: (cat: BlogCategory | null) => void;
}

export function CategoryFilterChips({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold touch-manipulation border transition-colors ${
          selected === null
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200'
        }`}
      >
        전체
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(selected === cat ? null : cat)}
          className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold touch-manipulation border transition-colors ${
            selected === cat
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          {CATEGORY_EMOJI[cat]} {cat}
        </button>
      ))}
    </div>
  );
}
