'use client';
import { usePathname } from 'next/navigation';
import { Landmark } from 'lucide-react';
import Sidebar from './Sidebar';
import AlertBell from './AlertBell';
import { useApp } from './AppProvider';

function MobileTopBar() {
  const { month } = useApp();
  return (
    <div className="mobile-topbar">
      <div className="mobile-topbar-brand">
        <span className="sb-logo" style={{ width: 28, height: 28, borderRadius: 8 }}>
          <Landmark size={14} />
        </span>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', letterSpacing: '-.02em' }}>PayrollDesk</span>
      </div>
      <AlertBell month={month} />
    </div>
  );
}

function DesktopTopBar() {
  const { month } = useApp();
  return (
    <div className="desktop-topbar">
      <AlertBell month={month} />
    </div>
  );
}

export default function Shell({ children }) {
  const path = usePathname();
  if (path === '/login') return <>{children}</>;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <MobileTopBar />
        <DesktopTopBar />
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
