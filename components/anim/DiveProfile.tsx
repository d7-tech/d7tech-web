'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from './useFrame';

/*
 * How an underwater glider moves: it sinks by making itself less buoyant and
 * rises by making itself more buoyant, and its wings turn that up-and-down
 * motion into forward travel, giving a sawtooth path. At the surface it sends
 * its data.
 */

const SURFACE = 52;
const BOTTOM = 248;
const POINTS: [number, number][] = [
  [30, SURFACE], [150, BOTTOM], [270, SURFACE], [390, BOTTOM], [510, SURFACE], [630, BOTTOM], [750, SURFACE],
];
const PERIOD = 16000; // one pass across, ms
const INK = '#eceff3';
const BLUE = '#7aa6f0';
const MUTED = '#8b95a3';
const MARK = '#55636f';
const MONO = 'var(--font-mono), ui-monospace, monospace';

export type DiveLabels = { dive: string; climb: string; uplink: string };

export default function DiveProfile({ labels }: { labels: DiveLabels }) {
  // cumulative length along the sawtooth, for constant speed
  const segs = useMemo(() => {
    const out: { a: [number, number]; b: [number, number]; from: number; len: number }[] = [];
    let acc = 0;
    for (let i = 0; i < POINTS.length - 1; i++) {
      const a = POINTS[i], b = POINTS[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      out.push({ a, b, from: acc, len });
      acc += len;
    }
    return { out, total: acc };
  }, []);

  const glider = useRef<SVGGElement>(null);
  const trail = useRef<SVGPolylineElement>(null);
  const wave = useRef<SVGPathElement>(null);
  const phase = useRef<SVGTextElement>(null);
  const arcs = useRef<(SVGPathElement | null)[]>([]);

  const ref = useFrame<SVGSVGElement>((t) => {
    // surface waves
    let d = '';
    for (let x = 0; x <= 800; x += 10) {
      const y = SURFACE + 2.5 * Math.sin(x * 0.045 + t * 0.0018);
      d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
    }
    wave.current?.setAttribute('d', d);

    // position along the path
    const dist = ((t % PERIOD) / PERIOD) * segs.total;
    const seg = segs.out.find((s) => dist <= s.from + s.len) ?? segs.out[segs.out.length - 1];
    const u = (dist - seg.from) / seg.len;
    const x = seg.a[0] + (seg.b[0] - seg.a[0]) * u;
    const y = seg.a[1] + (seg.b[1] - seg.a[1]) * u;
    const ang = (Math.atan2(seg.b[1] - seg.a[1], seg.b[0] - seg.a[0]) * 180) / Math.PI;
    glider.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);

    // trail so far
    let pts = '';
    for (const s of segs.out) {
      if (s.from > dist) break;
      pts += `${s.a[0]},${s.a[1]} `;
    }
    trail.current?.setAttribute('points', `${pts}${x.toFixed(1)},${y.toFixed(1)}`);

    // phase label: near the surface it is sending data
    const nearSurface = y < SURFACE + 14;
    const descending = seg.b[1] > seg.a[1];
    if (phase.current) {
      phase.current.textContent = nearSurface ? labels.uplink : descending ? labels.dive : labels.climb;
      phase.current.setAttribute('x', (x + 16).toFixed(1));
      phase.current.setAttribute('y', (nearSurface ? y - 16 : y + 4).toFixed(1));
      phase.current.setAttribute('fill', nearSurface ? BLUE : MUTED);
    }

    // uplink arcs above the glider while it is at the surface
    arcs.current.forEach((el, k) => {
      if (!el) return;
      if (!nearSurface) {
        el.setAttribute('stroke-opacity', '0');
        return;
      }
      const p = ((t / 900 + k / 3) % 1);
      const r = 8 + p * 22;
      el.setAttribute('d', `M${(x - r).toFixed(1)} ${(SURFACE - 6).toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(x + r).toFixed(1)} ${(SURFACE - 6).toFixed(1)}`);
      el.setAttribute('stroke-opacity', (1 - p).toFixed(2));
    });
  });

  return (
    <svg ref={ref} viewBox="0 0 800 280" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="dive-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14283a" />
          <stop offset="1" stopColor="#0b141d" />
        </linearGradient>
      </defs>
      <rect x="0" y={SURFACE} width="800" height={280 - SURFACE} fill="url(#dive-water)" />
      <g stroke={MARK} strokeWidth="1" strokeDasharray="3 6">
        <line x1="0" y1="118" x2="800" y2="118" />
        <line x1="0" y1="184" x2="800" y2="184" />
        <line x1="0" y1={BOTTOM} x2="800" y2={BOTTOM} />
      </g>
      <path ref={wave} fill="none" stroke={BLUE} strokeWidth="1.5" />
      <polyline points={POINTS.map((p) => p.join(',')).join(' ')} fill="none" stroke={MARK} strokeWidth="1.2" strokeDasharray="5 6" />
      <polyline ref={trail} fill="none" stroke={INK} strokeOpacity="0.75" strokeWidth="2" strokeLinejoin="round" />
      {[0, 1, 2].map((k) => (
        <path key={k} ref={(el) => { arcs.current[k] = el; }} fill="none" stroke={BLUE} strokeWidth="1.5" strokeOpacity="0" />
      ))}
      <g ref={glider}>
        <rect x="-15" y="-3.5" width="30" height="7" rx="3.5" fill={INK} />
        <line x1="-2" y1="0" x2="-8" y2="-11" stroke={INK} strokeWidth="2" />
        <line x1="-2" y1="0" x2="-8" y2="11" stroke={INK} strokeWidth="2" />
        <line x1="-15" y1="0" x2="-21" y2="-5" stroke={INK} strokeWidth="1.5" />
      </g>
      <text ref={phase} fontSize="12" fontFamily={MONO} fill={MUTED} />
    </svg>
  );
}
