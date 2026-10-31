'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, CalendarHeart, CalendarPlus, Lock, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import DeptBadge from '@/components/ui/DeptBadge';
import EditableCell from '@/components/ui/EditableCell';
import Select from '@/components/ui/Select';
import HolidayManager from '@/components/modals/HolidayManager';
import { api, IS_MOCK } from '@/lib/api';
import { calcRow } from '@/lib/utils/calc';
import { COMPANIES, getDepts } from '@/lib/utils/constants';
import { fmtDate, inr, monthLabel, num } from '@/lib/utils/format';

function RemarkCell({ r, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const cancelled = useRef(false);
  function start() { cancelled.current = false; setDraft(r.remark || ''); setEditing(true); }
  async function commit() {
    setEditing(false);
    if (cancelled.current || draft === (r.remark || '')) return;
    await onSave(draft);
  }
  if (editing) return (
    <td className="l">
      <input autoFocus className="ecell-text-input" value={draft} maxLength={300}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { cancelled.current = true; e.currentTarget.blur(); }
        }} />
    </td>
  );
  return (
    <td className="l">
      <button type="button" className={`ecell-text ${r.remark ? 'filled' : ''}`} onClick={start} title={r.remark || 'Add remark'}>
        {r.remark || <span style={{ opacity: 0.35 }}>Add…</span>}
      </button>
    </td>
  );
}

export default function SheetPage() {
  const { month, version, toast, confirm } = useApp();
  const [rows, setRows] = useState(null);
  const [emps, setEmps] = useState([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [company, setCompany] = useState('');
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);

  const load = useCallback(async () => {
    if (!month) return;
    try {
      const [r, e] = await Promise.all([api.getSheet(month), api.listEmployees()]);
      setRows(r);
      setEmps(e);
    } catch (err) {
      toast(err.message, 'error');
      setRows([]);
    }
  }, [month, toast]);

  useEffect(() => { setRows(null); setPick(''); load(); }, [load, version]);

  const remaining = useMemo(() => {
    const inSheet = new Set((rows || []).map((r) => r.employeeId));
    return emps.filter((e) => !inSheet.has(e.id));
  }, [rows, emps]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || []).filter((r) =>
      (!dept || r.dept === dept) &&
      (!company || r.company === company) &&
      (!s || [r.name, r.designation, r.place].some((v) => String(v || '').toLowerCase().includes(s))));
  }, [rows, q, dept, company]);

  const totals = useMemo(() => shown.reduce((t, r) => ({ gross: t.gross + (Number(r.ctc) || 0), absent: t.absent + (Number(r.absent) || 0), net: t.net + r.netSalary }), { gross: 0, absent: 0, net: 0 }), [shown]);

  async function syncFromDaily() {
    setSyncing(true);
    try {
      const res = await api.syncMonth(month);
      if (!res.synced) { toast('No daily attendance found for this month', 'warn'); return; }
      toast(`Synced ${res.synced} employee${res.synced > 1 ? 's' : ''} from daily attendance`);
      await load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSyncing(false); }
  }

  async function add(ids) {
    setBusy(true);
    try {
      const added = await api.addToSheet(month, ids);
      toast(added.length === 1 ? `Added ${added[0].name}` : `Added ${added.length} employees`);
      setPick('');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function save(r, field, value) {
    try {
      const patch = field === 'absent' ? { absentOverride: value } : { [field]: value };
      const u = await api.updateRow(r.id, patch, month);
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...u, srNo: x.srNo } : x)));
      if (field === 'remark') toast(`Remark saved for ${r.name}`);
      else toast(`${r.name}'s salary is ${inr(u.netSalary)}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function setOverride(r) {
    try {
      const u = await api.setOverride(r.id, month);
      setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, ...u, srNo: x.srNo } : x));
      toast(`${r.name} locked — daily sync will skip this row`);
    } catch (e) { toast(e.message, 'error'); }
  }

  async function resetOverride(r) {
    const ok = await confirm({
      title: 'Unlock row',
      message: `Unlock ${r.name}'s row? The next daily sync will overwrite manual edits.`,
      okLabel: 'Unlock',
    });
    if (!ok) return;
    try {
      const u = await api.resetOverride(r.id, month);
      setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, ...u, srNo: x.srNo } : x));
      toast(`${r.name} unlocked — daily sync will update this row again`);
    } catch (e) { toast(e.message, 'error'); }
  }

  async function remove(r) {
    const ok = await confirm({
      title: 'Remove from sheet',
      message: `Remove ${r.name} from the ${monthLabel(month)} sheet? Their attendance data for this month will be lost.`,
      variant: 'delete',
      okLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await api.deleteRow(r.id, month);
      toast(`${r.name} removed from sheet`);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const cell = (r, field, neg, max) => (
    <td className="num"><EditableCell value={r[field]} negative={neg} max={max} onCommit={(v) => save(r, field, v)} /></td>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Salary &amp; attendance sheet</div>
          <h1 className="h1">{monthLabel(month)}</h1>
          <p className="sub">Click any white cell to edit. Totals and net salary recalculate on save.</p>
        </div>
        <div className="add-bar">
          <Select value={pick} onChange={setPick} className="w-add" disabled={!remaining.length}>
            <option value="">Add an employee…</option>
            {remaining.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <button className="btn" disabled={!pick || busy} onClick={() => add([pick])}><Plus size={16} /> Add</button>
          <button className="btn primary" disabled={!remaining.length || busy} onClick={() => add(remaining.map((e) => e.id))}>
            <CalendarPlus size={16} /> Add all ({remaining.length})
          </button>
          <button className="btn" disabled={syncing} onClick={syncFromDaily} title="Pull present/absent/leave counts from daily attendance marks">
            <CalendarCheck size={16} /> {syncing ? 'Syncing…' : 'Sync from daily'}
          </button>
          {!IS_MOCK && (
            <button className="btn" onClick={() => setShowHolidays(true)} title="Manage paid holidays for this month">
              <CalendarHeart size={16} /> Holidays
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <label className="search"><Search size={16} /><input placeholder="Search name, designation, place" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Select value={dept} onChange={setDept} className="w-dept">
          <option value="">All departments</option>
          {getDepts().map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Select value={company} onChange={setCompany} className="w-dept">
          <option value="">All companies</option>
          {COMPANIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <div className="sum">
          <span>Gross <b className="mono">{inr(totals.gross)}</b></span>
          <span>Absent <b className="mono red">{num(totals.absent)}</b></span>
          <span>Net payable <b className="mono blue">{inr(totals.net)}</b></span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
        <table className="sheet">
          <thead>
            <tr>
              <th className="l">Sr.</th><th className="l">Name</th><th className="l">Dept.</th><th className="l">Place</th><th className="l">DOJ</th>
              <th>CTC/Month</th><th>Day</th><th>Present</th><th>Leave</th><th>EW</th><th>CL</th><th>Holiday</th><th>Absent</th>
              <th className="calc">Total Working</th><th className="calc">Day Deduction</th><th className="calc">Total Attend.</th>
              <th className="netc">Net Salary</th><th className="l">Remark</th><th />
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="l sr">{r.srNo}</td>
                  <td className="l"><div className="nm">{r.name}</div><div className="des">{r.designation}</div></td>
                <td className="l"><DeptBadge dept={r.dept} /></td>
                <td className="l place">{r.place}</td>
                <td className="l place">
                  <div className="mono" style={{ fontSize: 12 }}>{fmtDate(r.doj)}</div>
                  {r.doj && (
                    <div style={{ fontSize: 11, marginTop: 2, color: r.clEligible ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {r.clEligible ? 'CL eligible' : 'No CL'}
                    </div>
                  )}
                </td>
                {cell(r, 'ctc')}{cell(r, 'day')}{cell(r, 'present')}{cell(r, 'leave')}{cell(r, 'ew')}
                <td className="num">
                  <EditableCell value={r.cl} max={1} disabled={!r.clEligible}
                    onCommit={(v) => save(r, 'cl', v)}
                    title={r.clEligible ? '' : 'Not eligible — less than 6 months from DOJ'} />
                </td>
                <td className="num calc mono" title="Paid holidays — no deduction">{r.holiday ?? 0}</td>
                {cell(r, 'absent', true)}
                <td className="num calc mono">{num(r.totalWorking)}</td>
                <td className={`num calc mono ${r.dayDeduction > 0 ? 'red' : ''}`}>{num(r.dayDeduction)}</td>
                <td className="num calc mono">{num(r.totalAttendance)}</td>
                <td className="num netc mono">{inr(r.netSalary)}</td>
                <RemarkCell r={r} onSave={(v) => save(r, 'remark', v)} />
                <td className="del">
                  {r.manualOverride
                    ? <button className="icon-btn dark" title="Locked — click to unlock" onClick={() => resetOverride(r)}><Lock size={14} style={{ color: '#f59e0b' }} /></button>
                    : <button className="icon-btn dark" title="Unlocked — click to lock" onClick={() => setOverride(r)}><Lock size={14} style={{ color: '#94a3b8' }} /></button>
                  }
                  <button className="icon-btn" onClick={() => remove(r)} aria-label={`Remove ${r.name}`}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {rows && !shown.length && (
              <tr><td colSpan={19} className="empty">
                {rows.length ? 'No employees match your search.' : `Nobody is on the ${monthLabel(month)} sheet yet. Use “Add all (${remaining.length})” or import an Excel file.`}
              </td></tr>
            )}
            {!rows && <tr><td colSpan={19} className="empty">Loading…</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
      {showHolidays && (
        <HolidayManager
          month={month}
          onApplied={(count, updated) => { toast(`${count} holiday${count !== 1 ? 's' : ''} applied to ${updated} row${updated !== 1 ? 's' : ''}`); load(); }}
          onClose={() => setShowHolidays(false)}
        />
      )}
    </>
  );
}
