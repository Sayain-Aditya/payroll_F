'use client';
import { useRef, useState } from 'react';

const inr = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
const kfmt = (v) => `₹${v / 1000}k`;

function niceScale(max) {
  if (max <= 0) return { step: 1000, top: 4000 };
  const raw = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const mult = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * pow >= raw);
  const step = mult * pow;
  return { step, top: step * 4 };
}

// Tooltip rendered inside a relative wrapper — never overflows the card
function FloatTip({ tip, containerRef }) {
  if (!tip || !containerRef.current) return null;
  const rect = containerRef.current.getBoundingClientRect();
  const TIP_W = 180, TIP_H = 72;
  let left = tip.px - rect.left + 14;
  let top = tip.py - rect.top - 10;
  // clamp so tooltip stays inside the container
  if (left + TIP_W > rect.width) left = tip.px - rect.left - TIP_W - 14;
  if (top + TIP_H > rect.height) top = rect.height - TIP_H - 8;
  if (top < 0) top = 8;
  return (
    <div style={{
      position: 'absolute', left, top,
      background: '#0f172a', color: '#f1f5f9', borderRadius: 10,
      padding: '8px 14px', fontSize: 13, pointerEvents: 'none',
      boxShadow: '0 8px 24px #0002', zIndex: 99, whiteSpace: 'nowrap',
      border: '1px solid #1e293b', lineHeight: 1.7,
    }}>
      <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: 11, marginBottom: 2 }}>{tip.label}</div>
      <div style={{ color: '#93c5fd' }}>{tip.a}</div>
      <div style={{ color: '#60a5fa' }}>{tip.b}</div>
    </div>
  );
}

export function BarChart({ groups }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);
  const W = 860, H = 300, L = 58, R = 12, T = 12, B = 36;
  const pw = W - L - R, ph = H - T - B;
  const { step, top } = niceScale(Math.max(0, ...groups.map((g) => Math.max(g.a, g.b))));
  const y = (v) => T + ph - (v / top) * ph;
  const gw = pw / Math.max(groups.length, 1);
  const bw = Math.min(62, gw * 0.34);

  function onMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.floor((svgX - L) / gw);
    if (i >= 0 && i < groups.length) {
      const g = groups[i];
      setTip({ label: g.label, a: `Gross CTC: ${inr(g.a)}`, b: `Net Payroll: ${inr(g.b)}`, px: e.clientX, py: e.clientY });
    } else {
      setTip(null);
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="chart"
        onMouseMove={onMove} onMouseLeave={() => setTip(null)} style={{ cursor: 'crosshair' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(i * step)} y2={y(i * step)} className="grid" />
            <text x={L - 10} y={y(i * step) + 4} textAnchor="end" className="ax">{kfmt(i * step)}</text>
          </g>
        ))}
        {groups.map((g, i) => {
          const cx = L + gw * i + gw / 2;
          const active = tip?.label === g.label;
          const haGross = Math.max(0, T + ph - y(g.a));
          const haNet = Math.max(0, T + ph - y(g.b));
          const delay = `${i * 80}ms`;
          return (
            <g key={g.label}>
              <rect x={cx - bw - 2} y={y(g.a)} width={bw} height={haGross} rx="4"
                fill={active ? '#bfdbfe' : '#93c5fd'} style={{ transition: 'fill 0.15s',
                  transformOrigin: `${cx - bw / 2 - 2}px ${T + ph}px`,
                  animation: `bar-grow 0.55s cubic-bezier(0.22,1,0.36,1) ${delay} both` }} />
              <rect x={cx + 2} y={y(g.b)} width={bw} height={haNet} rx="4"
                fill={active ? '#1e40af' : '#1d4ed8'} style={{ transition: 'fill 0.15s',
                  transformOrigin: `${cx + bw / 2 + 2}px ${T + ph}px`,
                  animation: `bar-grow 0.55s cubic-bezier(0.22,1,0.36,1) ${delay} both` }} />
              {active && <line x1={cx} x2={cx} y1={T} y2={T + ph} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />}
              <text x={cx} y={H - 12} textAnchor="middle" className="ax">{g.label}</text>
            </g>
          );
        })}
      </svg>
      <FloatTip tip={tip} containerRef={wrapRef} />
    </div>
  );
}

function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}

export function LineChart({ points }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);
  const W = 1360, H = 240, L = 56, R = 16, T = 16, B = 34;
  const pw = W - L - R, ph = H - T - B;
  const { step, top } = niceScale(Math.max(0, ...points.map((p) => Math.max(p.a, p.b))));
  const x = (i) => (points.length === 1 ? L + pw / 2 : L + (pw * i) / (points.length - 1));
  const y = (v) => T + ph - (v / top) * ph;
  const A = points.map((p, i) => ({ x: x(i), y: y(p.a) }));
  const Bp = points.map((p, i) => ({ x: x(i), y: y(p.b) }));

  function onMove(e) {
    if (!points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    // find nearest point
    let best = 0, bestDist = Infinity;
    points.forEach((_, i) => { const d = Math.abs(x(i) - svgX); if (d < bestDist) { bestDist = d; best = i; } });
    const p = points[best];
    setTip({ i: best, label: p.label, a: `CTC: ${inr(p.a)}`, b: `Net Salary: ${inr(p.b)}`, px: e.clientX, py: e.clientY });
  }

  const active = tip?.i;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="chart"
        onMouseMove={onMove} onMouseLeave={() => setTip(null)} style={{ cursor: 'crosshair' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(i * step)} y2={y(i * step)} className="grid" />
            <text x={L - 10} y={y(i * step) + 4} textAnchor="end" className="ax">{kfmt(i * step)}</text>
          </g>
        ))}
        <path d={smooth(A)} fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
        <path d={smooth(Bp)} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />

        {/* vertical crosshair on active point */}
        {tip && (
          <line x1={x(tip.i)} x2={x(tip.i)} y1={T} y2={T + ph}
            stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
        )}

        {/* dots */}
        {points.map((_, i) => (
          <g key={i}>
            <circle cx={A[i].x} cy={A[i].y} r={tip?.i === i ? 6 : 3.5}
              fill={tip?.i === i ? '#93c5fd' : '#fff'} stroke="#93c5fd" strokeWidth="2"
              style={{ transition: 'r 0.1s' }} />
            <circle cx={Bp[i].x} cy={Bp[i].y} r={tip?.i === i ? 6 : 4.5}
              fill={tip?.i === i ? '#1d4ed8' : '#fff'} stroke="#1d4ed8" strokeWidth="2.5"
              style={{ transition: 'r 0.1s' }} />
          </g>
        ))}

        {points.map((p, i) => (
          <text key={p.label} x={x(i)} y={H - 12} className="ax"
            textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'}>
            {p.label}
          </text>
        ))}
      </svg>
      <FloatTip tip={tip} containerRef={wrapRef} />
    </div>
  );
}
