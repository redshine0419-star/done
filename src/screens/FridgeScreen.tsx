'use client';
import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { OcrBanner } from '@/components/fridge/OcrBanner';
import { ExpiryAlert } from '@/components/fridge/ExpiryAlert';
import { IngredientCard } from '@/components/fridge/IngredientCard';
import { AddIngredientModal } from '@/components/fridge/AddIngredientModal';
import { Plus } from 'lucide-react';
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

  const addButton = (
    <button
      onClick={() => { setEditItem(undefined); setModalOpen(true); }}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold touch-manipulation"
      style={{ background: 'var(--brand)', color: 'white' }}
    >
      <Plus size={14} strokeWidth={2.5} />
      추가
    </button>
  );

  return (
    <ScreenWrapper
      title="냉장고"
      subtitle={isEmpty ? '식재료를 등록해 레시피를 추천받아요' : `${state.fridgeItems.length}가지 식재료 보관 중`}
      action={addButton}
    >
      <div className="space-y-3">
        <OcrBanner />
        {!isEmpty && <ExpiryAlert items={state.fridgeItems} />}

        {isEmpty ? (
          <div className="flex flex-col items-center py-16 gap-5">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                 style={{ background: 'var(--brand-light)' }}>
              🫙
            </div>
            <div className="text-center">
              <p className="font-bold text-[16px]" style={{ color: 'var(--text-1)' }}>냉장고가 비어있어요</p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-3)' }}>식재료를 추가하면 맞춤 레시피를 추천해 드려요</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => { setEditItem(undefined); setModalOpen(true); }}
                className="w-full h-12 rounded-2xl font-bold text-[15px] touch-manipulation"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                직접 추가하기
              </button>
              <button
                onClick={() => dispatch({ type: 'LOAD_SAMPLE_DATA' })}
                className="w-full h-12 rounded-2xl font-semibold text-[14px] touch-manipulation"
                style={{ border: '1.5px solid var(--border)', color: 'var(--text-2)', background: 'var(--surface)' }}
              >
                샘플 데이터로 시작하기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
