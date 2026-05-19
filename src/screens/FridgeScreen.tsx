import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { OcrBanner } from '@/components/fridge/OcrBanner';
import { ExpiryAlert } from '@/components/fridge/ExpiryAlert';
import { IngredientCard } from '@/components/fridge/IngredientCard';
import { AddIngredientModal } from '@/components/fridge/AddIngredientModal';
import { useApp } from '@/context/AppContext';
import type { FridgeItem } from '@/types';

export function FridgeScreen() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  function handleAdd(item: Omit<FridgeItem, 'ingredient_id' | 'registered_at'>) {
    dispatch({
      type: 'ADD_FRIDGE_ITEM',
      payload: {
        ...item,
        ingredient_id: `u_${Date.now()}`,
        registered_at: new Date().toISOString(),
      },
    });
  }

  const sorted = [...state.fridgeItems].sort((a, b) => a.expire_days - b.expire_days);

  return (
    <ScreenWrapper title="🧊 스마트 냉장고" subtitle={`총 ${state.fridgeItems.length}가지 식재료 보관 중`}>
      <div className="space-y-4">
        <OcrBanner />
        <ExpiryAlert items={state.fridgeItems} />

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">보유 식재료</p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF6B35] text-white text-sm font-bold touch-manipulation shadow-sm"
          >
            + 추가
          </button>
        </div>

        <div className="space-y-2">
          {sorted.map(item => (
            <IngredientCard
              key={item.ingredient_id}
              item={item}
              onDelete={id => dispatch({ type: 'REMOVE_FRIDGE_ITEM', payload: { id } })}
            />
          ))}
          {sorted.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🫙</p>
              <p className="text-sm">냉장고가 비어있어요</p>
              <p className="text-xs mt-1">식재료를 추가해 보세요</p>
            </div>
          )}
        </div>
      </div>

      <AddIngredientModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </ScreenWrapper>
  );
}
