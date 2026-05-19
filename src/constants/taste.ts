export const TASTE_WEIGHTS: Record<1 | 2 | 3, number> = {
  1: 0.6,
  2: 1.0,
  3: 1.6,
};

export const TASTE_LABELS: Record<1 | 2 | 3, string> = {
  1: '약하게',
  2: '보통',
  3: '강하게',
};

export const UNITS = ['g', '개', '대', 'ml', '큰술', '작은술', '컵'] as const;

export const SCREEN_NAV = [
  { id: 'fridge',   label: '냉장고',   icon: '🧊' },
  { id: 'taste',    label: '미각',     icon: '❤️' },
  { id: 'blog',     label: '블로그',   icon: '📝' },
  { id: 'recipes',  label: '코스싱크', icon: '🍳' },
  { id: 'magazine', label: '매거진',   icon: '📰' },
] as const;
