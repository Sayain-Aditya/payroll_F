'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import DeptBadge from '@/components/DeptBadge';
import EditableCell from '@/components/EditableCell';
import Select from '@/components/Select';
import { api } from '@/lib/api';
import { getDepts } from '@/lib/constants';
import { fmtDate, inr, monthLabel, num } from '@/lib/format';

export default function SheetPage() {
  const { month, version, toast, confirm } = useApp();
  const [rows, setRows] = useState(null);
  const [emps, setEmps] = useState([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);

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
      (!dept || r.dept === dept) && (!s || [r.name, r.designation, r.place].some((v) => String(v || '').toLowerCase().includes(s))));
  }, [rows, q, dept]);

  const totals = useMemo(() => shown.reduce((t, r) => ({ gross: t.gross + (Number(r.ctc) || 0), absent: t.absent + (Number(r.absent) || 0), net: t.net + r.netSalary }), { gross: 0, absent: 0, net: 0 }), [shown]);

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
      // when absent is manually edited, store as absentOverride so calc knows it's manual
      const patch = field === 'absent' ? { absentOverride: value } : { [field]: value };
      const u = await api.updateRow(r.id, patch);
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...u } : x)));
      toast(`${r.name}'s salary is ${inr(u.netSalary)}`);
    } catch (e) {
      toast(e.message, 'error');
    }
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
      await api.deleteRow(r.id);
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
        </div>
      </div>

      <div className="filters">
        <label className="search"><Search size={16} /><input placeholder="Search name, designation, place" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Select value={dept} onChange={setDept} className="w-dept">
          <option value="">All departments</option>
          {getDepts().map((d) => <option key={d}>{d}</option>)}
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
              <th>CTC/Month</th><th>Day</th><th>Present</th><th>Leave</th><th>EW</th><th>CL</th><th>Absent</th>
              <th className="calc">Total Working</th><th className="calc">Day Deduction</th><th className="calc">Total Attend.</th>
              <th className="netc">Net Salary</th><th />
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
                {cell(r, 'absent', true)}
                <td className="num calc mono">{num(r.totalWorking)}</td>
                <td className={`num calc mono ${r.dayDeduction > 0 ? 'red' : ''}`}>{num(r.dayDeduction)}</td>
                <td className="num calc mono">{num(r.totalAttendance)}</td>
                <td className="num netc mono">{inr(r.netSalary)}</td>
                <td className="del"><button className="icon-btn" onClick={() => remove(r)} aria-label={`Remove ${r.name}`}><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {rows && !shown.length && (
              <tr><td colSpan={17} className="empty">
                {rows.length ? 'No employees match your search.' : `Nobody is on the ${monthLabel(month)} sheet yet. Use “Add all (${remaining.length})” or import an Excel file.`}
              </td></tr>
            )}
            {!rows && <tr><td colSpan={17} className="empty">Loading…</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
