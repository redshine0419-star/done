export function OcrBanner() {
  function handleTap() {
    alert('📸 영수증 OCR 기능은 준비 중입니다.\n배송 완료 메시지나 영수증 사진을 업로드하면 자동으로 식재료가 등록됩니다.');
  }

  return (
    <button
      onClick={handleTap}
      className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B35] to-orange-400 p-4 text-left shadow-md touch-manipulation"
    >
      <div className="flex items-center gap-3">
        <span className="text-4xl">📸</span>
        <div>
          <p className="text-white font-bold text-base">영수증 스캔으로 자동 등록</p>
          <p className="text-orange-100 text-sm mt-0.5">배송 메시지 / 마트 영수증 촬영 시 식재료 자동 인식</p>
        </div>
        <span className="ml-auto text-white/80 text-lg">›</span>
      </div>
    </button>
  );
}
