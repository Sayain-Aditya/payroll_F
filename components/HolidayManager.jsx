'use client';
import { useEffect, useState } from 'react';
import { CalendarHeart, Plus, Trash2, X } from 'lucide-react';
import { api, IS_MOCK } from '@/lib/api';
import { monthLabel } from '@/lib/format';

export default function HolidayManager({ month, onApplied, onClose }) {
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!month || IS_MOCK) return;
    api.listHolidays(month).then(setHolidays).catch(() => {});
  }, [month]);

  async function add() {
    if (!date || !name.trim()) return setErr('Date and name are required');
    setErr('');
    setBusy(true);
    try {
      const h = await api.createHoliday(date, name.trim());
      setHolidays((prev) => [...prev, h].sort((a, b) => a.date.localeCompare(b.date)));
      setDate(''); setName('');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    try {
      await api.deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (e) { setErr(e.message); }
  }

  async function apply() {
    setBusy(true);
    try {
      const res = await api.applyHolidays(month);
      onApplied(res.holidayCount, res.rowsUpdated);
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  // clamp date picker to current month
  const [y, m] = month.split('-');
  const minDate = `${y}-${m}-01`;
  const maxDate = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarHeart size={18} color="var(--blue)" /> Festive Holidays — {monthLabel(month)}
          </h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="muted small" style={{ margin: '0 0 14px' }}>
          Holidays are <b>paid</b> — they add to attendance without any salary deduction. Click "Apply to sheet" to update all employees.
        </p>

        {/* existing holidays */}
        <div style={{ display: 'grid', gap: 6, marginBottom: 14, maxHeight: 200, overflowY: 'auto' }}>
          {holidays.length === 0 && <div className="muted small" style={{ padding: '8px 0' }}>No holidays added yet.</div>}
          {holidays.map((h) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
              <span className="mono small" style={{ color: 'var(--blue)', minWidth: 90 }}>{h.date}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{h.name}</span>
              <button className="icon-btn" onClick={() => remove(h.id)} aria-label="Remove"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        {/* add new */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input type="date" value={date} min={minDate} max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', fontSize: 13 }} />
          <input placeholder="Holiday name (e.g. Diwali)" value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 13 }} />
          <button className="btn" onClick={add} disabled={busy}><Plus size={15} /></button>
        </div>

        {err && <div className="form-error" style={{ marginTop: 8 }}>{err}</div>}

        <div className="modal-foot" style={{ marginTop: 16 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={apply} disabled={busy || holidays.length === 0}>
            <CalendarHeart size={15} /> Apply to sheet ({holidays.length} holiday{holidays.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
}
