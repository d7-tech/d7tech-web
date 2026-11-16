'use client';

import { useRef } from 'react';
import { useFrame } from './useFrame';

/*
 * The three sensing layers from the indoor positioning project video, as small
 * live diagrams: UWB ranging, optical marker tracking, inertial data.
 */

const BLUE = '#7aa6f0';
const INK = '#eceff3';
const MUTED = '#8b95a3';
const MARK = '#55636f';
const MONO = 'var(--font-mono), ui-monospace, monospace';

function UwbPanel() {
  const anchors: [number, number][] = [[20, 20], [220, 20], [220, 130], [20, 130]];
  const tag = useRef<SVGCircleElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const rings = useRef<(SVGCircleElement | null)[]>([]);
  const st = useRef({ tick: -1, a: [0, 0, 0, 0], last: 0 });

  const ref = useFrame<SVGSVGElement>((t) => {
    const x = 120 + 62 * Math.sin(t * 0.00062);
    const y = 75 + 30 * Math.sin(t * 0.00113 + 1);
    tag.current?.setAttribute('cx', x.toFixed(1));
    tag.current?.setAttribute('cy', y.toFixed(1));
    const s = st.current;
    const tick = Math.floor(t / 140);
    if (tick !== s.tick) {
      s.tick = tick;
      s.a[tick % 4] = 1;
    }
    const dt = Math.max(0, Math.min(100, t - s.last));
    s.last = t;
    anchors.forEach(([ax, ay], k) => {
      lines.current[k]?.setAttribute('x2', x.toFixed(1));
      lines.current[k]?.setAttribute('y2', y.toFixed(1));
      lines.current[k]?.setAttribute('stroke-opacity', (s.a[k] * 0.8).toFixed(3));
      rings.current[k]?.setAttribute('r', Math.hypot(x - ax, y - ay).toFixed(1));
      rings.current[k]?.setAttribute('stroke-opacity', (s.a[k] * 0.3).toFixed(3));
      s.a[k] *= Math.exp(-dt / 300);
    });
  });

  return (
    <svg ref={ref} viewBox="0 0 240 150" className="w-full h-auto" aria-hidden="true">
      {anchors.map(([ax, ay], k) => (
        <g key={k}>
          <circle ref={(el) => { rings.current[k] = el; }} cx={ax} cy={ay} r="0" fill="none" stroke={BLUE} strokeOpacity="0" />
          <line ref={(el) => { lines.current[k] = el; }} x1={ax} y1={ay} x2={ax} y2={ay} stroke={BLUE} strokeWidth="1.2" strokeOpacity="0" />
          <rect x={ax - 4} y={ay - 4} width="8" height="8" fill={BLUE} />
        </g>
      ))}
      <circle ref={tag} cx="120" cy="75" r="4.5" fill={INK} />
    </svg>
  );
}

function OpticalPanel() {
  const markers: [number, number][] = [[50, 38], [120, 30], [190, 38]];
  const cam: [number, number] = [120, 140];
  const cone = useRef<SVGPathElement>(null);
  const boxes = useRef<(SVGRectElement | null)[]>([]);
  const rays = useRef<(SVGLineElement | null)[]>([]);

  const ref = useFrame<SVGSVGElement>((t) => {
    const h = -Math.PI / 2 + 0.62 * Math.sin(t * 0.0008);
    const half = 0.3, len = 135;
    const p1 = [cam[0] + len * Math.cos(h - half), cam[1] + len * Math.sin(h - half)];
    const p2 = [cam[0] + len * Math.cos(h + half), cam[1] + len * Math.sin(h + half)];
    cone.current?.setAttribute('d', `M${cam[0]} ${cam[1]}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${len} ${len} 0 0 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z`);
    markers.forEach(([mx, my], k) => {
      let da = Math.atan2(my - cam[1], mx - cam[0]) - h;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      const seen = Math.abs(da) < half;
      boxes.current[k]?.setAttribute('stroke-opacity', seen ? '1' : '0');
      rays.current[k]?.setAttribute('stroke-opacity', seen ? '0.5' : '0');
    });
  });

  return (
    <svg ref={ref} viewBox="0 0 240 150" className="w-full h-auto" aria-hidden="true">
      <path ref={cone} fill={BLUE} fillOpacity="0.08" stroke={BLUE} strokeOpacity="0.3" />
      {markers.map(([mx, my], k) => (
        <g key={k}>
          <line ref={(el) => { rays.current[k] = el; }} x1={cam[0]} y1={cam[1]} x2={mx} y2={my} stroke={BLUE} strokeDasharray="3 3" strokeOpacity="0" />
          <rect x={mx - 10} y={my - 10} width="20" height="20" fill="none" stroke={MARK} strokeWidth="1.5" />
          <rect x={mx - 6} y={my - 6} width="5" height="5" fill={MARK} />
          <rect x={mx + 1} y={my + 1} width="5" height="5" fill={MARK} />
          <rect ref={(el) => { boxes.current[k] = el; }} x={mx - 15} y={my - 15} width="30" height="30" fill="none" stroke={BLUE} strokeWidth="1.5" strokeOpacity="0" />
        </g>
      ))}
      <rect x={cam[0] - 7} y={cam[1] - 6} width="14" height="10" fill={INK} />
    </svg>
  );
}

/** Deterministic smooth noise so the traces look like sensor data, not sine waves. */
function noise(s: number, seed: number) {
  const hash = (k: number) => {
    const v = Math.sin(k * 127.1 + seed * 311.7) * 43758.5453;
    return v - Math.floor(v) - 0.5;
  };
  const i = Math.floor(s), f = s - i, u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

function ImuPanel() {
  const traces = useRef<(SVGPathElement | null)[]>([]);
  const rows = [
    { y: 34, a: 13, f: 0.09, seed: 1, label: 'ax' },
    { y: 75, a: 11, f: 0.05, seed: 2, label: 'ay' },
    { y: 116, a: 15, f: 0.14, seed: 3, label: 'gz' },
  ];

  const ref = useFrame<SVGSVGElement>((t) => {
    const shift = t * 0.028;
    rows.forEach((r, k) => {
      let d = '';
      for (let j = 0; j <= 100; j++) {
        const s = j + shift;
        const v = Math.sin(s * r.f + r.seed) * 0.55 + noise(s * 0.35, r.seed) * 0.9 + noise(s * 1.7, r.seed + 9) * 0.35;
        d += `${j ? 'L' : 'M'}${(36 + j * 1.98).toFixed(1)} ${(r.y - v * r.a).toFixed(1)}`;
      }
      traces.current[k]?.setAttribute('d', d);
    });
  });

  return (
    <svg ref={ref} viewBox="0 0 240 150" className="w-full h-auto" aria-hidden="true">
      {rows.map((r, k) => (
        <g key={r.label}>
          <line x1="36" y1={r.y} x2="234" y2={r.y} stroke={MARK} strokeWidth="1" />
          <text x="8" y={r.y + 4} fontSize="11" fill={MUTED} fontFamily={MONO}>{r.label}</text>
          <path ref={(el) => { traces.current[k] = el; }} fill="none" stroke={k === 2 ? BLUE : INK} strokeOpacity={k === 2 ? 1 : 0.8} strokeWidth="1.4" />
        </g>
      ))}
    </svg>
  );
}

const PANELS = [UwbPanel, OpticalPanel, ImuPanel];

export default function SensingLayers({ items }: { items: { name: string; text?: string }[] }) {
  return (
    <div className="grid gap-px bg-line border border-line rounded overflow-hidden sm:grid-cols-3">
      {items.map((it, k) => {
        const Panel = PANELS[k];
        return (
          <div key={it.name} className="bg-paper">
            <div className="bg-[#0f151c] p-4">{Panel && <Panel />}</div>
            <div className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">0{k + 1}</p>
              <p className="mt-2 font-semibold text-ink">{it.name}</p>
              {it.text && <p className="mt-1 text-ink-soft">{it.text}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
