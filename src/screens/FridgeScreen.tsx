'use client';
import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { OcrBanner } from '@/components/fridge/OcrBanner';
import { ExpiryAlert } from '@/components/fridge/ExpiryAlert';
import { IngredientCard } from '@/components/fridge/IngredientCard';
import { AddIngredientModal } from '@/components/fridge/AddIngredientModal';
import { useApp } from '@/context/AppContext';
import { getDaysUntilExpiry } from '@/utils/expiry';
import type { FridgeItem } from '@/types';

export function FridgeScreen() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<FridgeItem | undefined>(undefined);

  function handleAdd(item: Omit<FridgeItem, 'ingredient_id' | 'registered_at'>) {
    dispatch({
      type: 'ADD_FRIDGE_ITEM',
      payload: { ...item, ingredient_id: `u_${Date.now()}`, registered_at: new Date().toISOString() },
    });
  }

  function handleEdit(item: FridgeItem) {
    dispatch({ type: 'EDIT_FRIDGE_ITEM', payload: item });
  }

  function openEdit(item: FridgeItem) {
    setEditItem(item);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditItem(undefined);
  }

  const sorted = [...state.fridgeItems].sort(
    (a, b) => getDaysUntilExpiry(a.expire_date) - getDaysUntilExpiry(b.expire_date)
  );

  const isEmpty = sorted.length === 0;

  return (
    <ScreenWrapper
      title="🧊 스마트 냉장고"
      subtitle={isEmpty ? '식재료를 등록해 레시피를 추천받아요' : `총 ${state.fridgeItems.length}가지 식재료 보관 중`}
    >
      <div className="space-y-4">
        <OcrBanner />
        {!isEmpty && <ExpiryAlert items={state.fridgeItems} />}

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">보유 식재료</p>
          <button
            onClick={() => { setEditItem(undefined); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF6B35] text-white text-sm font-bold touch-manipulation shadow-sm"
          >
            + 추가
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center py-12 text-gray-400 gap-4">
            <p className="text-5xl">🫙</p>
            <div className="text-center">
              <p className="font-semibold text-gray-600 text-base">냉장고가 비어있어요</p>
              <p className="text-sm mt-1 text-gray-400">식재료를 추가하면 맞춤 레시피를 추천해 드려요</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={() => { setEditItem(undefined); setModalOpen(true); }}
                className="w-full h-12 rounded-2xl bg-[#FF6B35] text-white font-bold touch-manipulation"
              >
                직접 추가하기
              </button>
              <button
                onClick={() => dispatch({ type: 'LOAD_SAMPLE_DATA' })}
                className="w-full h-12 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold touch-manipulation text-sm"
              >
                샘플 데이터로 시작하기
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(item => (
              <IngredientCard
                key={item.ingredient_id}
                item={item}
                onEdit={openEdit}
                onDelete={id => dispatch({ type: 'REMOVE_FRIDGE_ITEM', payload: { id } })}
              />
            ))}
          </div>
        )}
      </div>

      <AddIngredientModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onAdd={handleAdd}
        editItem={editItem}
        onEdit={handleEdit}
      />
    </ScreenWrapper>
  );
}
