'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import DeptBadge from '@/components/DeptBadge';
import EmployeeModal from '@/components/EmployeeModal';
import Select from '@/components/Select';
import { api } from '@/lib/api';
import { getDepts } from '@/lib/constants';
import { fmtDate, inr } from '@/lib/format';

export default function EmployeesPage() {
  const { version, refresh, toast, confirm } = useApp();
  const [emps, setEmps] = useState(null);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | employee

  const load = useCallback(async () => {
    try { setEmps(await api.listEmployees()); } catch (e) { toast(e.message, 'error'); setEmps([]); }
  }, [toast]);
  useEffect(() => { load(); }, [load, version]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (emps || []).filter((e) =>
      (!dept || e.dept === dept) && (!s || [e.name, e.designation, e.place].some((v) => String(v || '').toLowerCase().includes(s))));
  }, [emps, q, dept]);

  async function remove(e) {
    const ok = await confirm({
      title: 'Delete employee',
      message: `Delete ${e.name} and all their attendance records? This cannot be undone.`,
      variant: 'delete',
      okLabel: 'Delete',
    });
    if (!ok) return;
    try { await api.deleteEmployee(e.id); toast(`${e.name} deleted`); refresh(); } catch (ex) { toast(ex.message, 'error'); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Employee master</div>
          <h1 className="h1">Employees</h1>
          <p className="sub">{emps ? `${emps.length} employee${emps.length === 1 ? '' : 's'} on record` : 'Loading…'}</p>
        </div>
        <button className="btn primary" onClick={() => setModal('new')}><Plus size={16} /> Add employee</button>
      </div>

      <div className="filters">
        <label className="search"><Search size={16} /><input placeholder="Search employees" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Select value={dept} onChange={setDept} className="w-dept">
          <option value="">All departments</option>
          {getDepts().map((d) => <option key={d}>{d}</option>)}
        </Select>
      </div>

      <div className="table-card">
        <div className="table-scroll">
        <table className="sheet emp-table">
          <thead>
            <tr>
              <th className="l">Sr.</th><th className="l">Name</th><th className="l">Designation</th><th className="l">Dept.</th>
              <th className="l">Place</th><th>CTC/Month</th><th className="l doj">DOJ</th><th className="l">Bank</th><th className="l">Account No.</th><th className="l">IFSC</th><th />
            </tr>
          </thead>
          <tbody>
            {shown.map((e, i) => (
              <tr key={e.id}>
                <td className="l sr">{i + 1}</td>
                <td className="l"><Link href={`/employees/${e.id}`} className="nm link">{e.name}</Link></td>
                <td className="l place">{e.designation}</td>
                <td className="l"><DeptBadge dept={e.dept} /></td>
                <td className="l place">{e.place}</td>
                <td className="num mono">{inr(e.ctc)}</td>
                <td className="l place doj">{fmtDate(e.doj)}</td>
                <td className="l place">{e.bankName || <span className="muted">—</span>}</td>
                <td className="l mono">{e.accountNo || <span className="muted">—</span>}</td>
                <td className="l mono">{e.ifsc || <span className="muted">—</span>}</td>
                <td className="del">
                  <Link href={`/employees/${e.id}`} className="icon-btn dark" title="Salary history" aria-label={`Salary history of ${e.name}`}><History size={17} /></Link>
                  <button className="icon-btn dark" title="Edit" onClick={() => setModal(e)} aria-label={`Edit ${e.name}`}><Pencil size={16} /></button>
                  <button className="icon-btn dark" title="Delete" onClick={() => remove(e)} aria-label={`Delete ${e.name}`}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {emps && !shown.length && <tr><td colSpan={11} className="empty">{emps.length ? 'No employees match your search.' : 'No employees yet. Click “Add employee” or import an Excel file.'}</td></tr>}
            {!emps && <tr><td colSpan={11} className="empty">Loading…</td></tr>}
          </tbody>
        </table>
        </div>
      </div>

      {modal && (
        <EmployeeModal
          key={modal === 'new' ? 'new' : modal.id}
          employee={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={(e, isNew) => { setModal(null); toast(isNew ? `Added ${e.name}` : `Updated ${e.name}`); refresh(); }}
        />
      )}
    </>
  );
}
