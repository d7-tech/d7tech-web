'use client';

import { useId, useMemo, useRef } from 'react';
import { useFrame, closedSpline } from './useFrame';

/*
 * Top-down view of the indoor positioning system in the test pool, drawn from
 * the sensor-fusion view in our project video: nine UWB anchors range to the
 * model ship in turn (about seven rounds a second), their range circles cross
 * at the ship, noisy raw fixes are smoothed into one fused track, and the
 * onboard camera picks up the ArUco markers in its view.
 */

const POOL = { x: 40, y: 40, w: 720, h: 400 };
const ANCHORS: [number, number][] = [
  [40, 40], [280, 40], [520, 40], [760, 40], [760, 240], [760, 440], [400, 440], [40, 440], [40, 240],
];
const MARKERS: [number, number][] = [
  [170, 130], [400, 112], [630, 135], [160, 350], [410, 368], [645, 345],
];
const WAYPOINTS: [number, number][] = [
  [130, 320], [300, 300], [500, 322], [632, 292], [684, 200], [612, 128], [462, 150], [332, 206], [232, 168], [140, 198], [104, 264],
];
const PERIOD = 26000; // one lap of the manoeuvre, ms
const TICK = 140; // one ranging round, ms (~7 Hz)
const PER_ROUND = 2; // anchors ranging in each round
const FOV_HALF = 0.42; // camera half-angle, rad
const FOV_LEN = 150;
const DOTS = 26;

const C = {
  water: '#0c1016',
  edge: '#2b333e',
  grid: '#151b23',
  blue: '#7aa6f0',
  ink: '#eceff3',
  muted: '#8b95a3',
  marker: '#3b4553',
};

export type TrackingLabels = { range: string; raw: string; fused: string; marker: string; camera: string };

export default function TrackingField({ labels, className = '' }: { labels: TrackingLabels; className?: string }) {
  const path = useMemo(() => closedSpline(WAYPOINTS, 900), []);
  const clipId = `pool-${useId().replace(/:/g, '')}`;

  const ship = useRef<SVGGElement>(null);
  const fov = useRef<SVGPathElement>(null);
  const trailOld = useRef<SVGPathElement>(null);
  const trailNew = useRef<SVGPathElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const rings = useRef<(SVGCircleElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const marks = useRef<(SVGRectElement | null)[]>([]);
  const st = useRef({
    tick: -1,
    lastT: 0,
    lineA: new Array(ANCHORS.length).fill(0) as number[],
    ringA: new Array(ANCHORS.length).fill(0) as number[],
    fixes: [] as { x: number; y: number; t: number }[],
  });

  const frame = useFrame<SVGSVGElement>((t) => {
    const s = st.current;
    const n = path.length;
    const f = ((t % PERIOD) / PERIOD) * n;
    const i = Math.floor(f);
    const u = f - i;
    const a = path[i % n], b = path[(i + 1) % n];
    const x = a[0] + (b[0] - a[0]) * u;
    const y = a[1] + (b[1] - a[1]) * u;
    const ahead = path[(i + 5) % n], behind = path[(i - 5 + n) % n];
    const h = Math.atan2(ahead[1] - behind[1], ahead[0] - behind[0]);

    ship.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((h * 180) / Math.PI).toFixed(1)})`);

    // camera field of view
    const p1 = [x + FOV_LEN * Math.cos(h - FOV_HALF), y + FOV_LEN * Math.sin(h - FOV_HALF)];
    const p2 = [x + FOV_LEN * Math.cos(h + FOV_HALF), y + FOV_LEN * Math.sin(h + FOV_HALF)];
    fov.current?.setAttribute(
      'd',
      `M${x.toFixed(1)} ${y.toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${FOV_LEN} ${FOV_LEN} 0 0 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z`,
    );
    MARKERS.forEach(([mx, my], k) => {
      const d = Math.hypot(mx - x, my - y);
      let da = Math.atan2(my - y, mx - x) - h;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      const seen = d < FOV_LEN && Math.abs(da) < FOV_HALF;
      const r = marks.current[k];
      if (r) {
        r.setAttribute('stroke', seen ? C.blue : C.marker);
        r.setAttribute('stroke-width', seen ? '2' : '1.5');
      }
    });

    // ranging rounds
    const tick = Math.floor(t / TICK);
    if (tick !== s.tick) {
      s.tick = tick;
      for (let k = 0; k < PER_ROUND; k++) {
        const idx = (tick * PER_ROUND + k) % ANCHORS.length;
        s.lineA[idx] = 1;
        s.ringA[idx] = 1;
      }
      // a raw fix, scattered around the true position
      const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 9;
      s.fixes.push({ x: x + g(), y: y + g(), t });
      if (s.fixes.length > DOTS) s.fixes.shift();
    }
    const dt = Math.max(0, Math.min(100, t - s.lastT));
    s.lastT = t;
    const decay = Math.exp(-dt / 170);

    ANCHORS.forEach(([ax, ay], k) => {
      const l = lines.current[k];
      if (l) {
        l.setAttribute('x2', x.toFixed(1));
        l.setAttribute('y2', y.toFixed(1));
        l.setAttribute('stroke-opacity', (s.lineA[k] * 0.75).toFixed(3));
      }
      const r = rings.current[k];
      if (r) {
        r.setAttribute('r', Math.hypot(x - ax, y - ay).toFixed(1));
        r.setAttribute('stroke-opacity', (s.ringA[k] * 0.32).toFixed(3));
      }
      s.lineA[k] *= decay;
      s.ringA[k] *= Math.exp(-dt / 320);
    });

    for (let k = 0; k < DOTS; k++) {
      const el = dots.current[k];
      const fx = s.fixes[k];
      if (!el) continue;
      if (!fx) {
        el.setAttribute('opacity', '0');
        continue;
      }
      el.setAttribute('cx', fx.x.toFixed(1));
      el.setAttribute('cy', fx.y.toFixed(1));
      el.setAttribute('opacity', Math.max(0, 0.85 - (t - fx.t) / 4200).toFixed(3));
    }

    // fused track: recent part bright, older part faint
    const seg = (from: number, to: number) => {
      let d = '';
      for (let k = from; k <= to; k += 3) {
        const p = path[((i - k) % n + n) % n];
        d += `${k === from ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      }
      return d;
    };
    trailNew.current?.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}` + seg(0, 150).replace(/^M/, 'L'));
    trailOld.current?.setAttribute('d', seg(147, 330));
  });

  const gridX = [120, 200, 280, 360, 440, 520, 600, 680];
  const gridY = [120, 200, 280, 360];

  return (
    <figure className={`m-0 ${className}`}>
      <svg ref={frame} viewBox="0 0 800 480" className="w-full h-auto" role="img" aria-label={labels.fused}>
        <defs>
          <clipPath id={clipId}>
            <rect x={POOL.x} y={POOL.y} width={POOL.w} height={POOL.h} />
          </clipPath>
        </defs>
        <rect x={POOL.x} y={POOL.y} width={POOL.w} height={POOL.h} fill={C.water} stroke={C.edge} strokeWidth="1.5" />
        <g stroke={C.grid} strokeWidth="1">
          {gridX.map((gx) => <line key={`x${gx}`} x1={gx} y1={POOL.y} x2={gx} y2={POOL.y + POOL.h} />)}
          {gridY.map((gy) => <line key={`y${gy}`} x1={POOL.x} y1={gy} x2={POOL.x + POOL.w} y2={gy} />)}
        </g>

        <g fill="none" stroke={C.blue} strokeWidth="1" clipPath={`url(#${clipId})`}>
          {ANCHORS.map(([ax, ay], k) => (
            <circle key={k} ref={(el) => { rings.current[k] = el; }} cx={ax} cy={ay} r="0" strokeOpacity="0" />
          ))}
        </g>

        <g>
          {MARKERS.map(([mx, my], k) => (
            <g key={k}>
              <rect ref={(el) => { marks.current[k] = el; }} x={mx - 9} y={my - 9} width="18" height="18" fill="none" stroke={C.marker} strokeWidth="1.5" />
              <rect x={mx - 5} y={my - 5} width="4" height="4" fill={C.marker} />
              <rect x={mx + 1} y={my + 1} width="4" height="4" fill={C.marker} />
            </g>
          ))}
        </g>

        <path ref={fov} clipPath={`url(#${clipId})`} fill={C.blue} fillOpacity="0.07" stroke={C.blue} strokeOpacity="0.25" strokeWidth="1" />

        <g stroke={C.blue} strokeWidth="1.2">
          {ANCHORS.map(([ax, ay], k) => (
            <line key={k} ref={(el) => { lines.current[k] = el; }} x1={ax} y1={ay} x2={ax} y2={ay} strokeOpacity="0" />
          ))}
        </g>

        <path ref={trailOld} fill="none" stroke={C.ink} strokeOpacity="0.18" strokeWidth="1.5" />
        <path ref={trailNew} fill="none" stroke={C.ink} strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />

        <g fill={C.muted}>
          {Array.from({ length: DOTS }, (_, k) => (
            <circle key={k} ref={(el) => { dots.current[k] = el; }} r="2.2" opacity="0" />
          ))}
        </g>

        <g>
          {ANCHORS.map(([ax, ay], k) => {
            const lx = ax <= 40 ? ax - 22 : ax >= 760 ? ax + 22 : ax;
            const ly = ay <= 40 ? ay - 14 : ay >= 440 ? ay + 22 : ay + 4;
            return (
              <g key={k}>
                <rect x={ax - 5} y={ay - 5} width="10" height="10" fill={C.blue} />
                <text x={lx} y={ly} textAnchor="middle" fontSize="11" fill={C.muted} fontFamily="var(--font-mono), ui-monospace, monospace">
                  A{k + 1}
                </text>
              </g>
            );
          })}
        </g>

        <g ref={ship}>
          <polygon points="14,0 5,6 -11,6 -11,-6 5,-6" fill={C.ink} />
        </g>
      </svg>

      <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 bg-brand-light" aria-hidden="true" />{labels.range}</span>
        <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-ink-muted" aria-hidden="true" />{labels.raw}</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 h-0.5 bg-ink" aria-hidden="true" />{labels.fused}</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 border border-ink-muted" aria-hidden="true" />{labels.marker}</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-2.5 bg-brand-light/20 border border-brand-light/40" aria-hidden="true" />{labels.camera}</span>
      </figcaption>
    </figure>
  );
}
