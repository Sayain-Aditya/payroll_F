'use client';
import { useRef, useState } from 'react';
import { num } from '@/lib/utils/format';

export default function EditableCell({ value, onCommit, negative = false, min = 0, max = Infinity, disabled = false, title = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const cancelled = useRef(false);

  function start() {
    if (disabled) return;
    cancelled.current = false;
    setDraft(String(value ?? 0));
    setEditing(true);
  }
  async function commit() {
    setEditing(false);
    if (cancelled.current) return;
    let n = Number(draft);
    if (draft === '' || !Number.isFinite(n)) return;
    n = Math.min(Math.max(n, min), max);
    if (n === Number(value)) return;
    await onCommit(n);
  }

  if (!editing) {
    return (
      <button type="button" className={`ecell ${negative && Number(value) > 0 ? 'neg' : ''} ${disabled ? 'ecell-disabled' : ''}`}
        onClick={start} title={title} style={disabled ? { cursor: 'not-allowed', opacity: 0.4 } : {}}>
        {num(value)}
      </button>
    );
  }
  return (
    <input
      autoFocus
      className="ecell-input"
      type="number"
      min={min}
      max={max === Infinity ? undefined : max}
      step="0.5"
      value={draft}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { cancelled.current = true; e.currentTarget.blur(); }
      }}
    />
  );
}
