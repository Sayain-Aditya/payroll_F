'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, TableProperties,
  Users, Settings, Download, FileUp, LogOut,
  Landmark, ChevronDown,
} from 'lucide-react';
import { useApp } from './AppProvider';
import { api, IS_MOCK } from '@/lib/api';
import { clearToken } from '@/lib/auth';
import { exportSheet } from '@/lib/exportSheet';
import { monthLabel } from '@/lib/format';

const NAV = [
  { href: '/',           label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/attendance', label: 'Attendance',     icon: CalendarDays },
  { href: '/sheet',      label: 'Monthly Sheet',  icon: TableProperties },
  { href: '/employees',  label: 'Employees',      icon: Users },
  { href: '/settings',   label: 'Settings',       icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { month, setMonth, openImport, toast } = useApp();
  const active = (href) => href === '/' ? path === '/' : path.startsWith(href);

  function logout() { clearToken(); router.replace('/login'); }

  async function onExport() {
    try {
      const rows = await api.getSheet(month);
      if (!rows.length) return toast(`Nothing to export for ${monthLabel(month)}`, 'error');
      await exportSheet(rows, month);
    } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <aside className="sidebar">
      {/* brand */}
      <div className="sb-brand">
        <span className="sb-logo"><Landmark size={18} /></span>
        <span className="sb-brand-name">PayrollDesk</span>
      </div>

      {/* month picker */}
      <div className="sb-month-wrap">
        <span className="sb-section-label">MONTH</span>
        <div className="sb-month-picker">
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="sb-month-input"
          />
          <ChevronDown size={13} className="sb-month-chevron" />
        </div>
      </div>

      {/* nav */}
      <span className="sb-section-label" style={{ marginTop: 8 }}>MENU</span>
      <nav className="sb-nav">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`sb-link${active(href) ? ' active' : ''}`}>
            <Icon size={17} className="sb-link-icon" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* actions */}
      <span className="sb-section-label" style={{ marginTop: 8 }}>ACTIONS</span>
      <div className="sb-actions">
        <button className="sb-action-btn" onClick={openImport}>
          <FileUp size={16} /> Import Excel
        </button>
        <button className="sb-action-btn primary" onClick={onExport}>
          <Download size={16} /> Export Sheet
        </button>
      </div>

      {/* bottom */}
      <div className="sb-bottom">
        {IS_MOCK && (
          <span className="demo-pill" style={{ fontSize: 11 }}>Demo</span>
        )}
        <button className="sb-logout" onClick={logout} title="Logout">
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
