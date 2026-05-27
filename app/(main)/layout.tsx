import { NavBar } from '@/components/layout/NavBar';
import { CookFAB } from '@/components/layout/CookFAB';
import { AddToHomeBanner } from '@/components/layout/AddToHomeBanner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh" style={{ background: 'var(--bg)' }}>
      <NavBar />
      <div className="md:pl-[220px]">
        {children}
      </div>
      <CookFAB />
      <AddToHomeBanner />
    </div>
  );
}
