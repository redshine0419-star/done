'use client';
import { useState } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { OcrBanner } from '@/components/fridge/OcrBanner';
import { ExpiryAlert } from '@/components/fridge/ExpiryAlert';
import { IngredientCard } from '@/components/fridge/IngredientCard';
import { AddIngredientModal } from '@/components/fridge/AddIngredientModal';
import { QuickAddPanel } from '@/components/fridge/QuickAddPanel';
import { Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getDaysUntilExpiry } from '@/utils/expiry';
import { t, isEn } from '@/i18n';
import type { FridgeItem } from '@/types';

export function FridgeScreen() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<FridgeItem | undefined>(undefined);
  const [showQuickAdd, setShowQuickAdd] = useState(true);

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
      {t.fridge.addItemShort}
    </button>
  );

  const fridgeSubtitle = isEmpty
    ? t.fridge.subtitleEmpty
    : isEn
      ? `${state.fridgeItems.length} ingredient${state.fridgeItems.length !== 1 ? 's' : ''} stored`
      : `${state.fridgeItems.length}가지 식재료 보관 중`;

  return (
    <ScreenWrapper
      title={t.fridge.title}
      subtitle={fridgeSubtitle}
      action={addButton}
    >
      <div className="space-y-3">
        <OcrBanner />
        {!isEmpty && <ExpiryAlert items={state.fridgeItems} />}

        {isEmpty ? (
          <div className="py-4">
            {showQuickAdd ? (
              <div className="rounded-3xl p-5 space-y-4"
                   style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <QuickAddPanel onDone={() => setShowQuickAdd(false)} />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setEditItem(undefined); setModalOpen(true); }}
                    className="flex-1 h-10 rounded-xl text-[13px] font-semibold touch-manipulation"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
                  >
                    {t.fridge.directInput}
                  </button>
                  <button
                    onClick={() => { dispatch({ type: 'LOAD_SAMPLE_DATA' }); setShowQuickAdd(false); }}
                    className="flex-1 h-10 rounded-xl text-[13px] font-semibold touch-manipulation"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
                  >
                    {t.fridge.startSample}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-4">
                <span className="text-5xl">🫙</span>
                <p className="text-[15px] font-bold" style={{ color: 'var(--text-1)' }}>{t.fridge.empty}</p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="px-6 h-11 rounded-2xl font-bold text-[14px] touch-manipulation"
                  style={{ background: 'var(--brand)', color: 'white' }}
                >
                  {t.common.addIngredients}
                </button>
              </div>
            )}
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
