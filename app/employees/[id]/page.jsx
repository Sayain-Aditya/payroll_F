'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import DeptBadge from '@/components/ui/DeptBadge';
import { LineChart } from '@/components/features/charts';
import { api } from '@/lib/api';
import { fmtDate, inr, monthLabel, num, shortMonth } from '@/lib/utils/format';

export default function EmployeeDetail() {
  const { id } = useParams();
  const { version, toast } = useApp();
  const [emp, setEmp] = useState(undefined); // undefined = loading, null = not found
  const [hist, setHist] = useState([]);

  useEffect(() => {
    let off = false;
    Promise.all([api.listEmployees(), api.getHistory(id)])
      .then(([list, h]) => { if (!off) { setEmp(list.find((e) => e.id === id) || null); setHist(h); } })
      .catch((e) => { if (!off) { setEmp(null); toast(e.message, 'error'); } });
    return () => { off = true; };
  }, [id, version, toast]);

  if (emp === undefined) return <p className="sub">Loading…</p>;
  if (emp === null) return (
    <>
      <Link href="/employees" className="back"><ArrowLeft size={16} /> All employees</Link>
      <div className="card empty-card">Employee not found.</div>
    </>
  );

  const points = hist.slice().reverse().map((r) => ({ label: shortMonth(r.month), a: Number(r.ctc) || 0, b: r.netSalary }));

  return (
    <>
      <Link href="/employees" className="back"><ArrowLeft size={16} /> All employees</Link>
      <div className="page-head tight">
        <div>
          <div className="eyebrow">Salary history</div>
          <h1 className="h1">{emp.name}</h1>
          <p className="sub meta">
            {emp.designation} <DeptBadge dept={emp.dept} /> · {emp.place} · CTC <span className="mono">{inr(emp.ctc)}</span> · Joined {fmtDate(emp.doj)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Net salary trend</h3>
          <div className="legend"><span><i style={{ background: '#93c5fd' }} />CTC</span><span><i style={{ background: '#1d4ed8' }} />Net salary</span></div>
        </div>
        {points.length ? <LineChart points={points} /> : <div className="empty-card">No attendance recorded yet.</div>}
      </div>

      <div className="table-card gap">
        <table className="sheet">
          <thead>
            <tr>
              <th className="l">Month</th><th>CTC</th><th>Day</th><th>Present</th><th>Leave</th><th>EW</th><th>CL</th><th>Absent</th>
              <th>Total Working</th><th>Deduction</th><th>Total Attend.</th><th>Net Salary</th>
            </tr>
          </thead>
          <tbody>
            {hist.map((r) => (
              <tr key={r.id}>
                <td className="l">{monthLabel(r.month)}</td>
                <td className="num mono">{inr(r.ctc)}</td>
                {['day', 'present', 'leave', 'ew', 'cl', 'absent', 'totalWorking', 'dayDeduction', 'totalAttendance'].map((k) => (
                  <td key={k} className="num mono">{num(r[k])}</td>
                ))}
                <td className="num mono blue bold">{inr(r.netSalary)}</td>
              </tr>
            ))}
            {!hist.length && <tr><td colSpan={12} className="empty">No attendance recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
