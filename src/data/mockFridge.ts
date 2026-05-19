import type { FridgeItem } from '@/types';
import { expireDateFromDays } from '@/utils/expiry';

export const mockFridgeItems: FridgeItem[] = [
  { ingredient_id: 'f1',  name: '돼지고기 앞다리살', amount: 300,  unit: 'g',   expire_date: expireDateFromDays(2),   icon: '🥩', registered_at: new Date().toISOString() },
  { ingredient_id: 'f2',  name: '두부',               amount: 1,    unit: '개',  expire_date: expireDateFromDays(5),   icon: '⬜', registered_at: new Date().toISOString() },
  { ingredient_id: 'f3',  name: '김치',               amount: 200,  unit: 'g',   expire_date: expireDateFromDays(30),  icon: '🥬', registered_at: new Date().toISOString() },
  { ingredient_id: 'f4',  name: '고추장',             amount: 150,  unit: 'g',   expire_date: expireDateFromDays(90),  icon: '🌶️', registered_at: new Date().toISOString() },
  { ingredient_id: 'f5',  name: '된장',               amount: 120,  unit: 'g',   expire_date: expireDateFromDays(90),  icon: '🟫', registered_at: new Date().toISOString() },
  { ingredient_id: 'f6',  name: '간장',               amount: 200,  unit: 'ml',  expire_date: expireDateFromDays(180), icon: '🫙', registered_at: new Date().toISOString() },
  { ingredient_id: 'f7',  name: '설탕',               amount: 300,  unit: 'g',   expire_date: expireDateFromDays(365), icon: '🍬', registered_at: new Date().toISOString() },
  { ingredient_id: 'f8',  name: '참기름',             amount: 100,  unit: 'ml',  expire_date: expireDateFromDays(180), icon: '🟡', registered_at: new Date().toISOString() },
  { ingredient_id: 'f9',  name: '대파',               amount: 2,    unit: '대',  expire_date: expireDateFromDays(3),   icon: '🌿', registered_at: new Date().toISOString() },
  { ingredient_id: 'f10', name: '달걀',               amount: 6,    unit: '개',  expire_date: expireDateFromDays(1),   icon: '🥚', registered_at: new Date().toISOString() },
  { ingredient_id: 'f11', name: '양파',               amount: 3,    unit: '개',  expire_date: expireDateFromDays(7),   icon: '🧅', registered_at: new Date().toISOString() },
  { ingredient_id: 'f12', name: '마늘',               amount: 30,   unit: 'g',   expire_date: expireDateFromDays(14),  icon: '🧄', registered_at: new Date().toISOString() },
];
