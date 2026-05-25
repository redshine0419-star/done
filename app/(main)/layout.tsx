import { BottomNav } from '@/components/layout/BottomNav';
import { CookFAB } from '@/components/layout/CookFAB';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh max-w-md mx-auto bg-gray-50">
      {children}
      <BottomNav />
      <CookFAB />
    </div>
  );
}
