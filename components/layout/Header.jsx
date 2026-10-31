'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Download, FileUp, Landmark, LogOut, Settings } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { api, IS_MOCK } from '@/lib/api';
import AlertBell from '@/components/features/AlertBell';
import { clearToken } from '@/lib/utils/auth';
import { exportSheet } from '@/lib/utils/exportSheet';
import { monthLabel } from '@/lib/utils/format';

const NAV = [
  ['/', 'Dashboard'],
  ['/attendance', 'Attendance'],
  ['/sheet', 'Monthly Sheet'],
  ['/employees', 'Employees'],
  ['/settings', 'Settings'],
];

export default function Header() {
  const path = usePathname();
  const router = useRouter();
  const { month, setMonth, openImport, toast } = useApp();
  const active = (href) => (href === '/' ? path === '/' : path.startsWith(href));

  function logout() {
    clearToken();
    router.replace('/login');
  }

  async function onExport() {
    try {
      const rows = await api.getSheet(month);
      if (!rows.length) return toast(`Nothing to export for ${monthLabel(month)}`, 'error');
      await exportSheet(rows, month);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function resetDemo() {
    if (!confirm('Reset demo data to the original sample?')) return;
    api.resetDemo();
    location.reload();
  }

  return (
    <header className="header">
      <Link href="/" className="brand">
        <span className="brand-logo"><Landmark size={20} /></span>
        PayrollDesk
      </Link>
      <nav className="nav">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={active(href) ? 'active' : ''}>{label}</Link>
        ))}
      </nav>
      <div className="header-right">
        {IS_MOCK && <button className="demo-pill" onClick={resetDemo} title="Data is stored in this browser only. Click to reset.">Demo data</button>}
        <span className="month-label">MONTH</span>
        <input className="month-input" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <button className="btn" onClick={openImport}><FileUp size={16} /> Import Excel</button>
        <button className="btn primary" onClick={onExport}><Download size={16} /> Export</button>
        <AlertBell month={month} />
        <button className="btn" onClick={logout} title="Logout"><LogOut size={16} /> Logout</button>
      </div>
    </header>
  );
}
