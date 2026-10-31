'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from 'lucide-react';
import { api, IS_MOCK } from '@/lib/api';
import { monthLabel } from '@/lib/utils/format';

const ICONS = {
  error: <XCircle size={14} color="var(--red)" />,
  warn: <AlertTriangle size={14} color="#d97706" />,
  info: <Info size={14} color="var(--blue)" />,
};

const TYPE_LABEL = {
  missing_attendance: 'Missing',
  high_absence: 'Absence',
  data_check: 'Data',
  salary_drop: 'Salary',
  cl_available: 'CL',
  work_anniversary: 'Anniversary',
};

export default function AlertBell({ month }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!month || IS_MOCK) return;
    setData(null);
    api.getAlerts(month).then(setData).catch(() => setData({ alerts: [], total: 0 }));
  }, [month]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = data?.total ?? 0;
  const alerts = data?.alerts ?? [];

  function goTo(alert) {
    setOpen(false);
    if (alert.type === 'missing_attendance' || alert.type === 'high_absence' || alert.type === 'salary_drop' || alert.type === 'data_check') {
      router.push('/sheet');
    } else {
      router.push(`/employees/${alert.empId}`);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)} aria-label="Alerts">
        <Bell size={18} />
        {count > 0 && <span className="bell-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="bell-drop">
          <div className="bell-drop-head">
            <span>Alerts — {monthLabel(month)}</span>
            {count === 0 && <CheckCircle2 size={14} color="var(--green)" />}
          </div>
          {alerts.length === 0 ? (
            <div className="bell-empty">All good! No issues for this month.</div>
          ) : (
            <div className="bell-list">
              {alerts.map((a, i) => (
                <button key={i} className="bell-item" onClick={() => goTo(a)}>
                  <span className="bell-item-icon">{ICONS[a.severity]}</span>
                  <span className="bell-item-body">
                    <span className="bell-item-tag">{TYPE_LABEL[a.type]}</span>
                    <span className="bell-item-msg">{a.message}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
