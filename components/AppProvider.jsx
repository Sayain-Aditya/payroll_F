'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import { currentMonth } from '@/lib/format';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const ICON = { success: CheckCircle2, warn: AlertTriangle, error: XCircle };

function ConfirmDialog({ opts, onOk, onCancel }) {
  if (!opts) return null;
  const isDelete = opts.variant === 'delete';
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-head">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: isDelete ? 'var(--red)' : 'var(--text)' }}>
            {isDelete && <Trash2 size={18} />}{opts.title || 'Are you sure?'}
          </h3>
        </div>
        <p style={{ margin: '0 0 20px', color: 'var(--muted)', lineHeight: 1.6 }}>{opts.message}</p>
        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className={`btn ${isDelete ? 'danger' : 'primary'}`} onClick={onOk} autoFocus>
            {opts.okLabel || (isDelete ? 'Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportingModal({ show }) {
  if (!show) return null;
  return (
    <div className="overlay">
      <div className="import-modal">
        <div className="import-excel">
          <div className="doc">
            <div className="doc-row h" />
            {[...Array(7)].map((_, i) => <div key={i} className="doc-row" style={{ width: `${65 + (i % 3) * 15}%` }} />)}
          </div>
          <div className="scan-line" />
          <div className="corner" />
        </div>
        <div className="import-title">Reading Excel file…</div>
        <div className="import-sub">Importing employee &amp; attendance data</div>
        <div className="import-dots"><span /><span /><span /></div>
      </div>
    </div>
  );
}

export default function AppProvider({ children }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [month, setMonthState] = useState('');
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [confirmOpts, setConfirmOpts] = useState(null);
  const [importing, setImporting] = useState(false);
  const confirmResolve = useRef(null);

  useEffect(() => {
    let m = '';
    try { m = localStorage.getItem('payrolldesk.month') || ''; } catch {}
    setMonthState(/^\d{4}-\d{2}$/.test(m) ? m : currentMonth());
  }, []);

  const setMonth = useCallback((m) => {
    setMonthState(m);
    try { localStorage.setItem('payrolldesk.month', m); } catch {}
  }, []);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const toast = useCallback((text, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'success' ? 3500 : 6500);
  }, []);

  // returns a Promise<boolean> — replaces window.confirm()
  const confirm = useCallback((opts) => new Promise((resolve) => {
    setConfirmOpts(typeof opts === 'string' ? { message: opts } : opts);
    confirmResolve.current = resolve;
  }), []);

  const handleOk = () => { setConfirmOpts(null); confirmResolve.current?.(true); };
  const handleCancel = () => { setConfirmOpts(null); confirmResolve.current?.(false); };

  const openImport = useCallback(() => fileRef.current?.click(), []);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !month) return;
    setImporting(true);
    try {
      const r = await api.importExcel(file, month);
      toast(`Imported ${r.total} employees · ${r.created} new, ${r.updated} updated`);
      if (r.warnings?.length) toast(`${r.warnings.length} warning(s): ${r.warnings[0]}`, 'warn');
      refresh();
      router.push('/sheet');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  }

  const value = useMemo(() => ({ month, setMonth, version, refresh, toast, confirm, openImport }),
    [month, setMonth, version, refresh, toast, confirm, openImport]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={onFile} />
      <ImportingModal show={importing} />
      <div className="toasts">
        {toasts.map((t) => {
          const Icon = ICON[t.type] || CheckCircle2;
          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <Icon size={16} /> <span>{t.text}</span>
            </div>
          );
        })}
      </div>
      <ConfirmDialog opts={confirmOpts} onOk={handleOk} onCancel={handleCancel} />
    </Ctx.Provider>
  );
}
