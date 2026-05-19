import { useState } from 'react';

export function OcrBanner() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowInfo(v => !v)}
        className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B35] to-orange-400 p-4 text-left shadow-md touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">📸</span>
          <div>
            <p className="text-white font-bold text-base">영수증 스캔으로 자동 등록</p>
            <p className="text-orange-100 text-sm mt-0.5">배송 메시지 / 마트 영수증 촬영 시 식재료 자동 인식</p>
          </div>
          <span className={`ml-auto text-white/80 text-lg transition-transform ${showInfo ? 'rotate-90' : ''}`}>›</span>
        </div>
      </button>

      {showInfo && (
        <div className="mt-2 rounded-2xl bg-orange-50 border border-orange-200 p-4">
          <p className="text-sm font-bold text-orange-700 mb-1">🚧 곧 출시 예정</p>
          <p className="text-xs text-orange-600 leading-relaxed">
            영수증 OCR 기능을 준비 중입니다.<br />
            마트 영수증이나 쿠팡·마켓컬리 배송 완료 메시지를 촬영하면 식재료가 자동으로 냉장고에 등록됩니다.
          </p>
          <button
            onClick={() => setShowInfo(false)}
            className="mt-3 text-xs text-orange-500 font-semibold touch-manipulation"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
