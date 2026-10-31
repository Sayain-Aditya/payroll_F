'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { api, IS_MOCK } from '@/lib/api';
import { monthLabel } from '@/lib/format';

const ICONS = {
  error: <XCircle size={14} color="var(--red)" />,
  warn: <AlertTriangle size={14} color="#d97706" />,
  info: <Info size={14} color="var(--blue)" />,
};

const TYPE_LABEL = {
  missing_attendance: 'Missing',
  high_absence: 'High Absence',
  data_check: 'Data Issue',
  salary_drop: 'Salary Drop',
  cl_available: 'CL Available',
  work_anniversary: 'Anniversary',
};

const SEV_COLOR = { error: 'var(--red)', warn: '#d97706', info: 'var(--blue)' };

export default function AlertsCard({ month }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!month || IS_MOCK) return;
    setData(null);
    api.getAlerts(month).then(setData).catch(() => setData({ alerts: [], total: 0 }));
  }, [month]);

  if (!data) return (
    <div className="card alerts-card" style={{ marginTop: 24 }}>
      <div className="card-head"><h3>Needs attention</h3></div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skel" style={{ height: 36, flex: '1 1 200px', borderRadius: 8 }} />)}
      </div>
    </div>
  );

  if (data.total === 0) return (
    <div className="card alerts-card" style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
      <CheckCircle2 size={18} color="var(--green)" />
      <span style={{ fontWeight: 600 }}>All good for {monthLabel(month)}</span>
      <span className="muted small">— no issues found</span>
    </div>
  );

  // group by severity: errors first, then warns, then info
  const sorted = [...data.alerts].sort((a, b) => {
    const order = { error: 0, warn: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const errors = data.alerts.filter((a) => a.severity === 'error').length;
  const warns = data.alerts.filter((a) => a.severity === 'warn').length;
  const infos = data.alerts.filter((a) => a.severity === 'info').length;

  return (
    <div className="card alerts-card" style={{ marginTop: 24 }}>
      <div className="card-head" style={{ marginBottom: 14 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={17} color="#d97706" /> Needs attention
        </h3>
        <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
          {errors > 0 && <span className="alert-pill error">{errors} critical</span>}
          {warns > 0 && <span className="alert-pill warn">{warns} warning{warns > 1 ? 's' : ''}</span>}
          {infos > 0 && <span className="alert-pill info">{infos} info</span>}
        </div>
      </div>
      <div className="alerts-grid">
        {sorted.map((a, i) => (
          <div key={i} className="alert-item" style={{ borderLeftColor: SEV_COLOR[a.severity] }}>
            <div className="alert-item-top">
              {ICONS[a.severity]}
              <span className="alert-tag">{TYPE_LABEL[a.type]}</span>
            </div>
            <div className="alert-msg">{a.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
