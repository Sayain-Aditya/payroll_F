'use client';
import { useEffect, useState } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { DEFAULTS, getSettings, saveSettings } from '@/lib/settings';

function Section({ title, hint, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {hint && <div className="muted small" style={{ marginTop: 3 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '11px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        {hint && <div className="muted small" style={{ marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

const numInput = (val, onChange, { min = 0, max, step = 1 } = {}) => (
  <input type="number" value={val} min={min} max={max} step={step}
    onChange={(e) => onChange(Number(e.target.value))}
    style={{ width: 100, border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 14 }} />
);

const sel = (val, onChange, options) => (
  <select value={val} onChange={(e) => onChange(e.target.value)}
    style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 14, background: '#fff', minWidth: 220 }}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

export default function SettingsPage() {
  const { toast, refresh, confirm } = useApp();
  const [s, setS] = useState(null);
  const [newDept, setNewDept] = useState('');

  useEffect(() => { setS(getSettings()); }, []);
  if (!s) return null;

  const set = (key) => (val) => setS((prev) => ({ ...prev, [key]: val }));

  function addDept() {
    const d = newDept.trim();
    if (!d || s.depts.includes(d)) return;
    setS((prev) => ({ ...prev, depts: [...prev.depts, d] }));
    setNewDept('');
  }

  function save() {
    saveSettings(s);
    toast('Settings saved — all calculations updated');
    refresh(); // triggers all pages to re-fetch and recalculate
  }

  async function reset() {
    const ok = await confirm({
      title: 'Reset to defaults',
      message: 'All settings will be restored to their default values. This cannot be undone.',
      okLabel: 'Reset',
    });
    if (!ok) return;
    saveSettings({ ...DEFAULTS });
    setS({ ...DEFAULTS });
    toast('Settings reset to defaults');
    refresh();
  }

  // live formula preview
  const denominator = s.workingDaysMode === 'fixed' ? s.fixedWorkingDays : 'Day';

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Configuration</div>
          <h1 className="h1">Settings</h1>
          <p className="sub">Changes take effect on all salary calculations after saving.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={reset}><RotateCcw size={15} /> Reset defaults</button>
          <button className="btn primary" onClick={save}><Save size={15} /> Save settings</button>
        </div>
      </div>

      {/* Company */}
      <Section title="Company">
        <Field label="Company name" hint="Shown in the header and exports">
          <input value={s.companyName} onChange={(e) => set('companyName')(e.target.value)}
            style={{ width: 220, border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 14 }} />
        </Field>
      </Section>

      {/* Monthly salary note */}
      <Section title="Monthly salary (CTC)" hint="Each employee has their own monthly CTC. Set it when adding an employee or edit it directly in the sheet.">
        <Field label="Where to set salary" hint="Go to Employees → Add/Edit employee, or click the CTC cell in the Sheet page">
          <span className="muted small">Per employee — not a global setting</span>
        </Field>
        <Field label="Working days denominator" hint="'Actual' = Day column per row · 'Fixed' = same number for all (e.g. 26)">
          {sel(s.workingDaysMode, set('workingDaysMode'), [
            ['actual', 'Actual (Day column per row)'],
            ['fixed', 'Fixed days for everyone'],
          ])}
        </Field>
        {s.workingDaysMode === 'fixed' && (
          <Field label="Fixed working days" hint="CTC is divided by this number to get the daily rate">
            {numInput(s.fixedWorkingDays, set('fixedWorkingDays'), { min: 1, max: 31 })}
          </Field>
        )}
      </Section>

      {/* Deductions */}
      <Section title="Deductions" hint="Controls how absent days reduce the salary">
        <Field label="Deduction per absent day" hint="Each absent day deducts this many days from Total Attendance (default 1.5)">
          {numInput(s.deductionPerAbsent, set('deductionPerAbsent'), { min: 0, max: 5, step: 0.5 })}
        </Field>
      </Section>

      {/* Casual Leave */}
      <Section title="Casual Leave (CL)">
        <Field label="Eligibility (months from DOJ)" hint="Employee must complete this many months before CL is granted">
          {numInput(s.clAfterMonths, set('clAfterMonths'), { min: 0, max: 24 })}
        </Field>
        <Field label="CL days per month" hint="CL days allowed per month once eligible">
          {numInput(s.clPerMonth, set('clPerMonth'), { min: 0, max: 5 })}
        </Field>
      </Section>

      {/* Departments */}
      <Section title="Departments" hint="Used in all department dropdowns across the app">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 0 14px' }}>
          {s.depts.map((d) => (
            <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1px solid var(--line)', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: 500 }}>
              {d}
              <button onClick={() => setS((p) => ({ ...p, depts: p.depts.filter((x) => x !== d) }))}
                style={{ border: 0, background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'grid', placeItems: 'center' }}
                aria-label={`Remove ${d}`}><Trash2 size={13} /></button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="New department name" value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDept()}
            style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 14 }} />
          <button className="btn" onClick={addDept}><Plus size={15} /> Add</button>
        </div>
      </Section>

      {/* Formula reference — live with current settings */}
      <Section title="Formula reference (live)" hint="Updates as you change settings above">
        <div style={{ display: 'grid', gap: 8, color: '#334155', lineHeight: 1.9, padding: '4px 0' }}>
          <div><b>Per Day Rate</b> = Employee's CTC ÷ <b style={{ color: 'var(--blue)' }}>{denominator}</b></div>
          <div><b>Absent</b> = Day − Present − Leave − CL</div>
          <div><b>Total Working</b> = Present + EW + CL</div>
          <div><b>Day Deduction</b> = (Leave × 1) + (Absent × <b style={{ color: 'var(--blue)' }}>{s.deductionPerAbsent}</b>)</div>
          <div><b>Total Attendance</b> = Day − Leave − (Absent × {s.deductionPerAbsent}) + EW + CL</div>
          <div><b>Net Salary</b> = Per Day Rate × Total Attendance</div>
          <div><b>CL</b> = <b style={{ color: 'var(--blue)' }}>{s.clPerMonth}</b> day/month after <b style={{ color: 'var(--blue)' }}>{s.clAfterMonths}</b> months from DOJ</div>
        </div>
      </Section>
    </>
  );
}
