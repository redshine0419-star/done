interface Props {
  isActive: boolean;
  isRunning: boolean;
  onNavigate: () => void;
}

export function CookFAB({ isActive, isRunning, onNavigate }: Props) {
  if (!isActive) return null;

  return (
    <button
      onClick={onNavigate}
      className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[#FF6B35] text-white text-2xl shadow-lg flex items-center justify-center touch-manipulation transition-transform active:scale-95 ${
        isRunning ? 'ring-4 ring-orange-300 ring-offset-2 animate-pulse' : ''
      }`}
      aria-label="조리 화면으로 이동"
    >
      ⏱
    </button>
  );
}
