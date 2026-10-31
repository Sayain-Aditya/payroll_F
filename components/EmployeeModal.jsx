'use client';
import { useState } from 'react';
import { CheckCircle, Loader, X, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getDepts } from '@/lib/constants';
import Select from './Select';

export default function EmployeeModal({ employee, onClose, onSaved }) {
  const [f, setF] = useState({
    name: employee?.name || '', designation: employee?.designation || '', dept: employee?.dept || 'Sales',
    place: employee?.place || '', ctc: employee?.ctc ?? '', doj: employee?.doj || '',
    bankName: employee?.bankName || '', accountNo: employee?.accountNo || '', ifsc: employee?.ifsc || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ifscStatus, setIfscStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [ifscBank, setIfscBank] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function verifyIfsc(code) {
    const val = code.trim().toUpperCase();
    if (val.length < 11) { setIfscStatus(null); setIfscBank(''); return; }
    setIfscStatus('checking');
    setIfscBank('');
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${val}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIfscStatus('valid');
      setIfscBank(`${data.BANK} — ${data.BRANCH}, ${data.CITY}`);
    } catch {
      setIfscStatus('invalid');
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Name is required');
    if (ifscStatus === 'invalid') return setErr('IFSC code is invalid. Please correct it before saving.');
    if (ifscStatus === 'checking') return setErr('Please wait for IFSC verification to complete.');
    setBusy(true);
    setErr('');
    try {
      const data = { ...f, name: f.name.trim(), ctc: Number(f.ctc) || 0, ifsc: f.ifsc.toUpperCase() };
      const saved = employee ? await api.updateEmployee(employee.id, data) : await api.createEmployee(data);
      onSaved(saved, !employee);
    } catch (ex) {
      setErr(ex.message);
      setBusy(false);
    }
  }

  const ifscIcon = ifscStatus === 'checking' ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
    : ifscStatus === 'valid' ? <CheckCircle size={14} color="var(--green)" />
    : ifscStatus === 'invalid' ? <XCircle size={14} color="var(--red)" />
    : null;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <h3>{employee ? 'Edit employee' : 'Add employee'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="form-grid">
          <label className="full">Name<input autoFocus value={f.name} onChange={set('name')} placeholder="Full name" /></label>
          <label>Designation<input value={f.designation} onChange={set('designation')} placeholder="e.g. Sales Manager" /></label>
          <label>Department<Select value={f.dept} onChange={(v) => setF({ ...f, dept: v })}>{getDepts().map((d) => <option key={d}>{d}</option>)}</Select></label>
          <label>Place<input value={f.place} onChange={set('place')} placeholder="City" /></label>
          <label>CTC / month (₹)<input type="number" min="0" value={f.ctc} onChange={set('ctc')} placeholder="0" /></label>
          <label className="full">Date of joining<input type="date" value={f.doj} onChange={set('doj')} /></label>
        </div>
        <div style={{ borderTop: '1px solid var(--line)', margin: '12px 0 4px', paddingTop: 12, fontWeight: 600, fontSize: 13, color: 'var(--muted)', letterSpacing: '.04em' }}>BANK DETAILS</div>
        <div className="form-grid">
          <label>Bank name<input value={f.bankName} onChange={set('bankName')} placeholder="e.g. SBI" /></label>
          <label>Account no.<input value={f.accountNo} onChange={set('accountNo')} placeholder="Account number" /></label>
          <label className="full">IFSC code
            <div style={{ position: 'relative' }}>
              <input value={f.ifsc} onChange={(e) => { set('ifsc')(e); verifyIfsc(e.target.value); }}
                placeholder="e.g. SBIN0001234" style={{ textTransform: 'uppercase', width: '100%', paddingRight: 32 }} />
              {ifscIcon && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>{ifscIcon}</span>}
            </div>
            {ifscStatus === 'valid' && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>{ifscBank}</div>}
            {ifscStatus === 'invalid' && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>Invalid IFSC code</div>}
          </label>
        </div>
        {err && <div className="form-error">{err}</div>}
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving...' : employee ? 'Save changes' : 'Add employee'}</button>
        </div>
      </form>
    </div>
  );
}
