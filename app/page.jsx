'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarX2, IndianRupee, Percent, UploadCloud, Users, Wallet } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import DeptBadge from '@/components/ui/DeptBadge';
import { BarChart } from '@/components/features/charts';
import AlertsCard from '@/components/features/AlertsCard';
import { api } from '@/lib/api';
import { DEPTS } from '@/lib/utils/constants';
import { inr, monthLabel, num } from '@/lib/utils/format';

const agg = (rows) => rows.reduce((s, r) => ({
  net: s.net + r.netSalary,
  gross: s.gross + (Number(r.ctc) || 0),
  present: s.present + (Number(r.present) || 0),
  absent: s.absent + (Number(r.absent) || 0),
  days: s.days + (Number(r.day) || 0),
  n: s.n + 1,
}), { net: 0, gross: 0, present: 0, absent: 0, days: 0, n: 0 });

const order = (n) => { const i = DEPTS.indexOf(n); return i < 0 ? 99 : i; };

// animates 0 → target over `duration` ms, starts after `delay` ms
function useCountUp(target, { duration = 900, delay = 0 } = {}) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) { setVal(target); return; }
    setVal(0);
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        // ease out cubic
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);
  return val;
}

function Stat({ label, rawValue, fmt, icon: Icon, highlight, delay = 0 }) {
  const counted = useCountUp(rawValue, { delay });
  return (
    <div className={`stat anim ${highlight ? 'hl' : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-top"><span className="label">{label}</span><Icon size={16} /></div>
      <div className="stat-val mono">{fmt(counted)}</div>
    </div>
  );
}

function CountUp({ value, fmt = num, delay = 0 }) {
  const counted = useCountUp(value, { delay });
  return <span>{fmt(counted)}</span>;
}

export default function Dashboard() {
  const { month, version, openImport, toast } = useApp();
  const [rows, setRows] = useState(null);
  const [empCount, setEmpCount] = useState(0);

  useEffect(() => {
    if (!month) return;
    let off = false;
    setRows(null);
    Promise.all([api.getSheet(month), api.listEmployees()])
      .then(([r, e]) => { if (!off) { setRows(r); setEmpCount(e.length); } })
      .catch((e) => { if (!off) { setRows([]); toast(e.message, 'error'); } });
    return () => { off = true; };
  }, [month, version, toast]);

  const total = useMemo(() => agg(rows || []), [rows]);
  const depts = useMemo(() => {
    const names = [...new Set((rows || []).map((r) => r.dept || 'Other'))].sort((a, b) => order(a) - order(b));
    return names.map((n) => ({ name: n, ...agg((rows || []).filter((r) => (r.dept || 'Other') === n)) }));
  }, [rows]);

  const topAbsent = useMemo(() =>
    [...(rows || [])].sort((a, b) => (Number(b.absent) || 0) - (Number(a.absent) || 0)).slice(0, 5)
  , [rows]);

  const maxAbsent = topAbsent[0] ? (Number(topAbsent[0].absent) || 0) : 1;
  const loading = rows === null;

  if (loading) return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Payroll overview</div>
          <h1 className="h1">{monthLabel(month)}</h1>
          <p className="sub"><span className="skel" style={{ width: 260 }} /></p>
        </div>
        <Link href="/sheet" className="link-btn">Open monthly sheet <ArrowRight size={16} /></Link>
      </div>

      <div className="stats">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="stat">
            <div className="stat-top"><span className="skel" style={{ width: 90 }} /><span className="skel" style={{ width: 16, height: 16, borderRadius: 4 }} /></div>
            <div className="skel" style={{ width: 120, height: 32, marginTop: 14, borderRadius: 8 }} />
          </div>
        ))}
      </div>

      <h2 className="h2">Departments</h2>
      <div className="dept-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card dept-card">
            <div className="dept-top"><span className="skel" style={{ width: 70, height: 22, borderRadius: 999 }} /><span className="skel" style={{ width: 40 }} /></div>
            <div className="skel" style={{ width: 60, height: 11, marginBottom: 6 }} />
            <div className="skel" style={{ width: 130, height: 28, marginBottom: 16, borderRadius: 8 }} />
            <div style={{ display: 'grid', gap: 10 }}>
              {[...Array(3)].map((_, j) => <div key={j} className="skel" style={{ width: '100%', height: 14 }} />)}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-bottom" style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr' }}>
        <div className="card"><div className="skel" style={{ width: 200, height: 20, marginBottom: 16 }} /><div className="skel" style={{ width: '100%', height: 180, borderRadius: 10 }} /></div>
        <div className="card"><div className="skel" style={{ width: 120, height: 20, marginBottom: 16 }} />{[...Array(5)].map((_, i) => <div key={i} className="skel" style={{ width: '100%', height: 36, marginBottom: 8, borderRadius: 8 }} />)}</div>
        <div className="card how"><div className="skel" style={{ width: 160, height: 20, marginBottom: 14 }} />{[...Array(6)].map((_, i) => <div key={i} className="skel skel-light" style={{ width: '100%', height: 14, marginBottom: 10 }} />)}</div>
      </div>
    </>
  );

  return (
    <>
      <div className="page-head anim" style={{ animationDelay: '0ms' }}>
        <div>
          <div className="eyebrow">Payroll overview</div>
          <h1 className="h1">{monthLabel(month)}</h1>
          <p className="sub">{rows ? `${rows.length} of ${empCount} employees have attendance this month` : 'Loading…'}</p>
        </div>
        <Link href="/sheet" className="link-btn">Open monthly sheet <ArrowRight size={16} /></Link>
      </div>

      <div className="stats">
        <Stat label="NET PAYROLL" rawValue={total.net} fmt={inr} icon={Wallet} highlight delay={60} />
        <Stat label="GROSS CTC" rawValue={total.gross} fmt={inr} icon={IndianRupee} delay={120} />
        <Stat label="HEADCOUNT" rawValue={total.n} fmt={num} icon={Users} delay={180} />
        <Stat label="PAID ATTENDANCE" rawValue={total.days ? (total.present / total.days) * 100 : 0} fmt={(v) => total.days ? `${v.toFixed(1)}%` : '—'} icon={Percent} delay={240} />
        <Stat label="ABSENT DAYS" rawValue={total.absent} fmt={num} icon={CalendarX2} delay={300} />
      </div>

      <h2 className="h2 anim" style={{ animationDelay: '340ms' }}>Departments</h2>
      {depts.length === 0 ? (
        <div className="card empty-card anim" style={{ animationDelay: '380ms' }}>
          {rows ? `No attendance for ${monthLabel(month)} yet. Import an Excel file or add employees on the monthly sheet.` : 'Loading…'}
        </div>
      ) : (
        <div className="dept-grid">
          {depts.map((d, i) => (
            <div key={d.name} className="card dept-card anim" style={{ animationDelay: `${380 + i * 60}ms` }}>
              <div className="dept-top"><DeptBadge dept={d.name} /><span className="muted small">{d.n} staff</span></div>
              <div className="label">NET PAYROLL</div>
              <div className="dept-net mono"><CountUp value={d.net} fmt={inr} delay={380 + i * 60} /></div>
              <dl>
                <div><dt>Gross CTC</dt><dd className="mono"><CountUp value={d.gross} fmt={inr} delay={380 + i * 60} /></dd></div>
                <div><dt>Present days</dt><dd className="mono"><CountUp value={d.present} fmt={num} delay={380 + i * 60} /></dd></div>
                <div><dt>Absent days</dt><dd className="mono red"><CountUp value={d.absent} fmt={num} delay={380 + i * 60} /></dd></div>
              </dl>
            </div>
          ))}
        </div>
      )}

      <AlertsCard month={month} />

      <div className="dash-bottom" style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr' }}>
        <div className="card anim" style={{ animationDelay: `${380 + depts.length * 60 + 60}ms` }}>
          <div className="card-head">
            <h3>Gross CTC vs net payroll</h3>
            <div className="legend"><span><i style={{ background: '#93c5fd' }} />Gross CTC</span><span><i style={{ background: '#1d4ed8' }} />Net payroll</span></div>
          </div>
          {depts.length ? <BarChart groups={depts.map((d) => ({ label: d.name, a: d.gross, b: d.net }))} /> : <div className="empty-card">No data to chart.</div>}
        </div>

        <div className="card anim" style={{ animationDelay: `${380 + depts.length * 60 + 100}ms` }}>
          <div className="card-head" style={{ marginBottom: 8 }}>
            <h3>Top absentees</h3>
            <span className="muted small">{monthLabel(month)}</span>
          </div>
          {topAbsent.length === 0 ? (
            <div className="empty-card">No absence data.</div>
          ) : (
            <div className="absent-list">
              {topAbsent.map((r, i) => (
                <div key={r.id} className="absent-row">
                  <div className={`absent-rank ${i === 0 ? 'top' : ''}`}>{i + 1}</div>
                  <div className="absent-name">
                    <div className="nm">{r.name}</div>
                    <div className="muted small">{r.dept || '—'}</div>
                  </div>
                  <div className="absent-bar-wrap">
                    <div className="absent-bar" style={{ width: `${((Number(r.absent) || 0) / maxAbsent) * 100}%` }} />
                  </div>
                  <div className="mono red" style={{ fontSize: 13, fontWeight: 700, width: 28, textAlign: 'right', flexShrink: 0 }}>
                    {num(r.absent)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card how anim" style={{ animationDelay: `${380 + depts.length * 60 + 140}ms` }}>
          <h3>How salary is calculated</h3>
          <p><b>Absent</b> = Day − Present − EW − Leave − CL</p>
          <p><b>Total Working</b> = Present + EW + CL</p>
          <p><b>Day Deduction</b> = Absent × 1.5</p>
          <p><b>Total Attendance</b> = Total Working − Day Deduction + Leave</p>
          <p><b>Net Salary</b> = (CTC ÷ Day) × Total Attendance</p>
          <p><b>CL</b> = 1 per month, only after 6 months from DOJ</p>
          <button className="dashed" onClick={openImport}><UploadCloud size={18} /> Upload attendance Excel</button>
        </div>
      </div>
    </>
  );
}
