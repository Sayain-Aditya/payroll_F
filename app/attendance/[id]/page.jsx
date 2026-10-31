'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import DeptBadge from '@/components/DeptBadge';

const STATUS = {
  present: { label: 'Present',  short: 'P', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', dot: '#22c55e' },
  absent:  { label: 'Absent',   short: 'A', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444' },
  leave:   { label: 'Leave',    short: 'L', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b' },
  halfday: { label: 'Half Day', short: 'H', color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd', dot: '#a855f7' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toYM(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

function StatCard({ status, count, total }) {
  const s = STATUS[status];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="cal-stat-card" style={{ borderColor: s.border }}>
      <div className="cal-stat-top">
        <span className="cal-stat-dot" style={{ background: s.dot }} />
        <span className="cal-stat-label" style={{ color: s.color }}>{s.label}</span>
      </div>
      <div className="cal-stat-val" style={{ color: s.color }}>{count}</div>
      <div className="cal-stat-bar-wrap">
        <div className="cal-stat-bar" style={{ width: `${pct}%`, background: s.dot }} />
      </div>
      <div className="cal-stat-pct">{pct}%</div>
    </div>
  );
}

export default function EmployeeCalendarPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useApp();
  const [month, setMonth] = useState(() => toYM(new Date()));
  const [calendar, setCalendar] = useState({});
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getEmployeeCalendar(id, month),
      emp ? Promise.resolve(emp) : api.listEmployees().then((list) => list.find((e) => e.id === id)),
    ]).then(([cal, e]) => {
      setCalendar(cal.calendar || {});
      if (e) setEmp(e);
    }).catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, month]); // eslint-disable-line

  function shiftMonth(delta) {
    const [y, m] = month.split('-').map(Number);
    setMonth(toYM(new Date(y, m - 1 + delta, 1)));
  }

  const [y, m] = month.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1).getDay();
  const totalDays = new Date(y, m, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;

  // pad to full weeks
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: totalDays }, (_, i) => i + 1)
  );
  const remainder = cells.length % 7;
  if (remainder) cells.push(...Array(7 - remainder).fill(null));

  const counts = { present: 0, absent: 0, leave: 0, halfday: 0, unmarked: 0 };
  for (let d = 1; d <= totalDays; d++) {
    const key = `${month}-${String(d).padStart(2, '0')}`;
    const s = calendar[key];
    if (s) counts[s]++; else counts.unmarked++;
  }
  const markedDays = totalDays - counts.unmarked;

  return (
    <div className="cal-page">
      {/* ── header ── */}
      <div className="cal-header">
        <button className="cal-back-btn" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </button>

        {emp ? (
          <div className="cal-emp-info">
            <div className="cal-emp-avatar">{emp.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className="cal-emp-name">{emp.name}</div>
              <div className="cal-emp-meta">
                {emp.designation && <span>{emp.designation}</span>}
                {emp.dept && <DeptBadge dept={emp.dept} />}
                {emp.company && <span className="cal-emp-company">{emp.company}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="cal-emp-info">
            <div className="cal-emp-avatar cal-emp-avatar-skel" />
            <div>
              <div className="skel" style={{ width: 140, height: 18, marginBottom: 6 }} />
              <div className="skel" style={{ width: 100, height: 13 }} />
            </div>
          </div>
        )}
      </div>

      {/* ── stat cards ── */}
      <div className="cal-stats">
        {Object.keys(STATUS).map((s) => (
          <StatCard key={s} status={s} count={counts[s]} total={totalDays} />
        ))}
        <div className="cal-stat-card cal-stat-unmarked">
          <div className="cal-stat-top">
            <span className="cal-stat-dot" style={{ background: '#94a3b8' }} />
            <span className="cal-stat-label" style={{ color: '#64748b' }}>Unmarked</span>
          </div>
          <div className="cal-stat-val" style={{ color: '#64748b' }}>{counts.unmarked}</div>
          <div className="cal-stat-bar-wrap">
            <div className="cal-stat-bar" style={{ width: `${totalDays > 0 ? Math.round((counts.unmarked / totalDays) * 100) : 0}%`, background: '#94a3b8' }} />
          </div>
          <div className="cal-stat-pct">{totalDays > 0 ? Math.round((counts.unmarked / totalDays) * 100) : 0}%</div>
        </div>
      </div>

      {/* ── calendar card ── */}
      <div className="cal-card">
        {/* month nav */}
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => shiftMonth(-1)}><ChevronLeft size={18} /></button>
          <div className="cal-nav-title">
            <span className="cal-nav-month">{MONTHS[m - 1]}</span>
            <span className="cal-nav-year">{y}</span>
          </div>
          <button className="cal-nav-btn" onClick={() => shiftMonth(1)}><ChevronRight size={18} /></button>
        </div>

        {/* progress bar */}
        <div className="cal-progress-wrap" title={`${markedDays} of ${totalDays} days marked`}>
          {Object.keys(STATUS).map((s) => {
            const pct = totalDays > 0 ? (counts[s] / totalDays) * 100 : 0;
            return pct > 0 ? (
              <div key={s} className="cal-progress-seg" style={{ width: `${pct}%`, background: STATUS[s].dot }} />
            ) : null;
          })}
        </div>
        <div className="cal-progress-label">{markedDays} / {totalDays} days marked</div>

        {/* day headers */}
        <div className="cal-grid-7">
          {DAYS.map((d) => <div key={d} className="cal-weekday">{d}</div>)}
        </div>

        {/* cells */}
        <div className={`cal-grid-7 cal-cells${loading ? ' cal-loading' : ''}`}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="cal-cell-empty" />;
            const dateStr = `${month}-${String(day).padStart(2, '0')}`;
            const status = calendar[dateStr];
            const s = status ? STATUS[status] : null;
            const isToday = isCurrentMonth && day === today.getDate();
            return (
              <div
                key={day}
                className={`cal-cell${s ? ' cal-cell-marked' : ''}${isToday ? ' cal-cell-today' : ''}`}
                style={s ? { background: s.bg, borderColor: s.border } : {}}
                title={s ? s.label : 'Unmarked'}
              >
                <span className="cal-cell-day" style={s ? { color: s.color } : isToday ? { color: 'var(--blue)' } : {}}>
                  {day}
                </span>
                {s && (
                  <span className="cal-cell-badge" style={{ background: s.dot, color: '#fff' }}>
                    {s.short}
                  </span>
                )}
                {isToday && !s && <span className="cal-today-dot" />}
              </div>
            );
          })}
        </div>

        {/* legend */}
        <div className="cal-legend">
          {Object.entries(STATUS).map(([key, s]) => (
            <span key={key} className="cal-legend-item">
              <span className="cal-legend-dot" style={{ background: s.dot }} />
              {s.label}
            </span>
          ))}
          <span className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background: '#e2e8f0', border: '1px solid #cbd5e1' }} />
            Unmarked
          </span>
        </div>
      </div>
    </div>
  );
}
