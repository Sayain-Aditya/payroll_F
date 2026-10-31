'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Save, Search } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import DeptBadge from '@/components/ui/DeptBadge';
import Select from '@/components/ui/Select';
import { api } from '@/lib/api';
import { COMPANIES, getDepts } from '@/lib/utils/constants';

const STATUS = [
  { key: 'present',  label: 'P', title: 'Present',  color: '#15803d', bg: '#dcfce7' },
  { key: 'absent',   label: 'A', title: 'Absent',   color: '#dc2626', bg: '#fee2e2' },
  { key: 'leave',    label: 'L', title: 'Leave',    color: '#d97706', bg: '#fef3c7' },
  { key: 'halfday',  label: 'H', title: 'Half Day', color: '#7c3aed', bg: '#ede9fe' },
  { key: 'holiday',  label: 'HO', title: 'Holiday', color: '#0369a1', bg: '#e0f2fe' },
];

const today = () => new Date().toISOString().slice(0, 10);

function StatusBtn({ current, value, onChange }) {
  const s = STATUS.find((x) => x.key === value);
  const active = current === value;
  return (
    <button
      onClick={() => onChange(active ? null : value)}
      title={s.title}
      style={active ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
      className={`att-status-btn${active ? ' active' : ''}`}
    >
      {s.label}
    </button>
  );
}

export default function AttendancePage() {
  const { toast } = useApp();
  const [date, setDate] = useState(today());
  const [dept, setDept] = useState('');
  const [company, setCompany] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [dirty, setDirty] = useState({}); // employeeId -> status
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (d, dp, co) => {
    setRows(null);
    try {
      const res = await api.getDaily(d, dp, co);
      setRows(res.data);
      setDirty({});
    } catch (e) { toast(e.message, 'error'); setRows([]); }
  }, [toast]);

  useEffect(() => { load(date, dept, company); }, [date, dept, company]); // eslint-disable-line

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || []).filter((r) => !s || r.name.toLowerCase().includes(s) || (r.dept || '').toLowerCase().includes(s));
  }, [rows, q]);

  function setStatus(empId, status) {
    setDirty((prev) => ({ ...prev, [empId]: status }));
    setRows((prev) => prev.map((r) => r.employeeId === empId ? { ...r, status } : r));
  }

  async function save() {
    const records = Object.entries(dirty)
      .filter(([, s]) => s !== null)
      .map(([employeeId, status]) => ({ employeeId, status }));
    if (!records.length) { toast('No changes to save', 'warn'); return; }
    setSaving(true);
    try {
      await api.saveDaily(date, records);
      toast(`Saved attendance for ${records.length} employee${records.length > 1 ? 's' : ''}`);
      // reload from DB to confirm persisted state
      const res = await api.getDaily(date, dept, company);
      setRows(res.data);
      setDirty({});
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  }

  function markAll(status) {
    const updates = {};
    shown.forEach((r) => { updates[r.employeeId] = status; });
    setDirty((prev) => ({ ...prev, ...updates }));
    setRows((prev) => prev.map((r) => shown.find((s) => s.employeeId === r.employeeId) ? { ...r, status } : r));
  }

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, leave: 0, halfday: 0, holiday: 0, unmarked: 0 };
    (rows || []).forEach((r) => r.status ? c[r.status]++ : c.unmarked++);
    return c;
  }, [rows]);

  const dirtyCount = Object.keys(dirty).filter((k) => dirty[k] !== null).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Daily tracking</div>
          <h1 className="h1">Attendance</h1>
          <p className="sub">{rows ? `${rows.length} employees` : 'Loading…'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="month-input"
            style={{ fontFamily: 'var(--mono)' }}
          />
          <button className="btn primary" onClick={save} disabled={saving || !dirtyCount}>
            <Save size={15} /> {saving ? 'Saving…' : `Save${dirtyCount ? ` (${dirtyCount})` : ''}`}
          </button>
        </div>
      </div>

      {/* summary pills */}
      <div className="att-summary">
        {STATUS.map((s) => (
          <span key={s.key} className="att-pill" style={{ background: s.bg, color: s.color }}>
            {s.title}: <b>{counts[s.key]}</b>
          </span>
        ))}
        {counts.unmarked > 0 && (
          <span className="att-pill" style={{ background: '#f1f5f9', color: '#64748b' }}>
            Unmarked: <b>{counts.unmarked}</b>
          </span>
        )}
      </div>

      <div className="filters">
        <label className="search"><Search size={16} /><input placeholder="Search employees" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Select value={dept} onChange={setDept} className="w-dept">
          <option value="">All departments</option>
          {getDepts().map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Select value={company} onChange={setCompany} className="w-dept">
          <option value="">All companies</option>
          {COMPANIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {STATUS.map((s) => (
            <button key={s.key} className="btn" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => markAll(s.key)}>
              Mark all {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="sheet" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th className="l" style={{ width: 40 }}>Sr.</th>
                <th className="l">Name</th>
                <th className="l">Dept.</th>
                <th className="l">Company</th>
                <th style={{ textAlign: 'center', minWidth: 220 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.employeeId} className={dirty[r.employeeId] !== undefined ? 'att-row-dirty' : ''}>
                  <td className="l sr">{i + 1}</td>
                  <td className="l"><span className="nm">{r.name}</span></td>
                  <td className="l"><DeptBadge dept={r.dept} /></td>
                  <td className="l place">{r.company || <span className="muted">—</span>}</td>
                  <td>
                    <div className="att-status-group">
                      {STATUS.map((s) => (
                        <StatusBtn key={s.key} current={r.status} value={s.key} onChange={(v) => setStatus(r.employeeId, v)} />
                      ))}
                      {r.status && (
                        <span className="att-current-label" style={{ color: STATUS.find((x) => x.key === r.status)?.color }}>
                          <Check size={12} /> {STATUS.find((x) => x.key === r.status)?.title}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows && !shown.length && <tr><td colSpan={5} className="empty">No employees found.</td></tr>}
              {!rows && <tr><td colSpan={5} className="empty">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
