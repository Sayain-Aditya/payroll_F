import { DEPT_STYLE } from '@/lib/utils/constants';

export default function DeptBadge({ dept }) {
  if (!dept) return <span className="muted">-</span>;
  const s = DEPT_STYLE[dept] || { bg: '#f1f5f9', fg: '#334155' };
  return <span className="badge" style={{ background: s.bg, color: s.fg }}>{dept}</span>;
}
