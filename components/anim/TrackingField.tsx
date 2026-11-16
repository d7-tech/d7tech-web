'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { emptyPose, type Pose3D } from '@/components/three/pose';

const Overlay3D = dynamic(() => import('@/components/three/Overlay3D'), { ssr: false });
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

/** Optional opening: a photo of the real ship whose cut-out slides into the diagram and takes over the track. */
export type TrackingEntry = {
  photo: string;
  photoAlt: string;
  photoW: number;
  photoH: number;
  sprite: string;
  spriteAspect: number;
  /** ship centre and width in the photo, as fractions of the photo */
  ship: { cx: number; cy: number; w: number };
};

const SHIP_W = 112; // ship cut-out length on the water, viewBox units (at the plane's mid depth)
const TILT = 38; // how far the pool surface leans back, degrees
const PLANE_SCALE = 0.92;
const SPRITE_BASE = 400; // base width of the ship element, px (scaled per frame)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const DEG = Math.PI / 180;
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export default function TrackingField({
  labels,
  className = '',
  entry,
}: {
  labels: TrackingLabels;
  className?: string;
  entry?: TrackingEntry;
}) {
  const path = useMemo(() => closedSpline(WAYPOINTS, 900), []);
  // where the ship joins the track: the point whose (reversed) heading points most nearly left, like the ship in the photo
  const joinIdx = useMemo(() => {
    let best = 0, bestErr = Infinity;
    const n = path.length;
    for (let i = 0; i < n; i++) {
      const a = path[(i + 5) % n], b = path[(i - 5 + n) % n];
      const h = Math.atan2(b[1] - a[1], b[0] - a[0]); // reversed travel direction
      const err = Math.abs(Math.atan2(Math.sin(h - Math.PI), Math.cos(h - Math.PI)));
      if (err < bestErr) { bestErr = err; best = i; }
    }
    return best;
  }, [path]);
  const stage = useRef<HTMLDivElement>(null);
  const svgEl = useRef<SVGSVGElement | null>(null);
  const photoEl = useRef<HTMLDivElement>(null);
  const spriteEl = useRef<HTMLDivElement>(null);
  const legend = useRef<HTMLElement>(null);
  const anchorEl = useRef<SVGCircleElement>(null);
  const shadowEl = useRef<SVGEllipseElement>(null);
  const wakeEl = useRef<SVGPathElement>(null);
  const wakeOuterEl = useRef<SVGPathElement>(null);
  const waterLines = useRef<(SVGPathElement | null)[]>([]);
  const pose = useRef<Pose3D>(emptyPose());
  const invalidate = useRef<() => void>(() => {});
  const onInvalidate = useCallback((fn: () => void) => {
    invalidate.current = fn;
  }, []);
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
    entered: false,
    tEnter: 0,
    reduce: false,
    prevH: 0,
    lean: 0,
  });

  useEffect(() => {
    st.current.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const frame = useFrame<SVGSVGElement>((t) => {
    const s = st.current;
    const n = path.length;

    // with an entry, scroll moves from the photo (p = 0) to the diagram (p = 1)
    let p = 1;
    const box = stage.current?.getBoundingClientRect();
    if (entry && box && !s.reduce) {
      const vh = window.innerHeight;
      p = clamp01((vh * 0.78 - (box.top + box.height / 2)) / (vh * 0.4));
    }
    const e = easeInOut(p);
    const dir = entry ? -1 : 1;

    let f: number;
    if (!entry) f = ((t % PERIOD) / PERIOD) * n;
    else if (p <= 0) {
      s.entered = false;
      f = joinIdx;
    } else {
      if (!s.entered) { s.entered = true; s.tEnter = t; }
      f = joinIdx - (((t - s.tEnter) % PERIOD) / PERIOD) * n;
    }
    f = ((f % n) + n) % n;
    const i = Math.floor(f);
    const u = f - i;
    const a = path[i % n], b = path[(i + 1) % n];
    const x = a[0] + (b[0] - a[0]) * u;
    const y = a[1] + (b[1] - a[1]) * u;
    const ahead = path[(i + 5) % n], behind = path[(i - 5 + n) % n];
    const h = dir > 0 ? Math.atan2(ahead[1] - behind[1], ahead[0] - behind[0]) : Math.atan2(behind[1] - ahead[1], behind[0] - ahead[0]);

    if (entry && box && spriteEl.current) {
      const k = box.width / 800;
      const hd = (h * 180) / Math.PI;
      const dt = Math.max(0, Math.min(100, t - s.lastT));

      // things that live on the water surface (tilted with the plane)
      anchorEl.current?.setAttribute('cx', x.toFixed(1));
      anchorEl.current?.setAttribute('cy', y.toFixed(1));
      shadowEl.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${hd.toFixed(1)})`);
      const back = h + Math.PI;
      const arm = (len: number, spread: number, side: number) =>
        `${(x + len * Math.cos(back + side * spread)).toFixed(1)} ${(y + len * Math.sin(back + side * spread)).toFixed(1)}`;
      const sx0w = x + 22 * Math.cos(back), sy0w = y + 22 * Math.sin(back);
      wakeEl.current?.setAttribute('d', `M${arm(95, 0.3, -1)}L${sx0w.toFixed(1)} ${sy0w.toFixed(1)}L${arm(95, 0.3, 1)}`);
      wakeOuterEl.current?.setAttribute('d', `M${arm(130, 0.42, -1)}L${sx0w.toFixed(1)} ${sy0w.toFixed(1)}L${arm(130, 0.42, 1)}`);
      wakeEl.current?.setAttribute('stroke-opacity', (0.55 + 0.12 * Math.sin(t * 0.006)).toFixed(3));
      waterLines.current.forEach((el, j) => {
        if (!el) return;
        const y0 = 70 + j * 62;
        let d = '';
        for (let xx = 40; xx <= 760; xx += 16) {
          d += `${xx === 40 ? 'M' : 'L'}${xx} ${(y0 + 3.2 * Math.sin(xx * 0.028 + t * 0.0016 + j * 1.3)).toFixed(1)}`;
        }
        el.setAttribute('d', d);
      });

      // where the ship's point lands on screen after the 3D tilt, and how far away it is
      const ar = anchorEl.current?.getBoundingClientRect();
      const px1 = ar ? ar.left + ar.width / 2 - box.left : x * k;
      const py1 = ar ? ar.top + ar.height / 2 - box.top : y * k;
      const depth = ar ? ar.width / (24 * k) : 1;

      // the ship in the photo (object-cover): centre, length, and its waterline
      const A = entry.photoW / entry.photoH;
      const imgW = box.width / box.height > A ? box.width : box.height * A;
      const imgH = imgW / A;
      const ox = (box.width - imgW) / 2, oy = (box.height - imgH) / 2;
      const sx0 = ox + entry.ship.cx * imgW, sy0 = oy + entry.ship.cy * imgH, sw0 = entry.ship.w * imgW;
      const wl0 = sy0 + (sw0 / entry.spriteAspect) * 0.36;

      // one continuous move: from the photo's waterline to the ship's point on the pool
      const sw1 = SHIP_W * k * depth;
      const wx = sx0 + (px1 - sx0) * e;
      const wy = wl0 + (py1 - wl0) * e;
      const L = sw0 + (sw1 - sw0) * e;

      // the real cut-out leads, then hands over to the 3D model early in the move
      const spriteOpacity = 1 - smooth(0.1, 0.26, e);
      const sc = L / SPRITE_BASE;
      const sh = L / entry.spriteAspect;
      spriteEl.current.style.opacity = spriteOpacity.toFixed(3);
      spriteEl.current.style.transform =
        `translate(${(wx - SPRITE_BASE / 2).toFixed(1)}px, ${(wy - sh * 0.36 - SPRITE_BASE / entry.spriteAspect / 2).toFixed(1)}px) scale(${sc.toFixed(4)})`;

      // 3D model: starts side-on like the photo, the camera rises to look down on it as it settles on the water
      let dyaw = -h - Math.PI;
      dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      let dh = h - s.prevH;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      s.prevH = h;
      const turnRate = dt > 0 ? dh / dt : 0;
      s.lean += (Math.max(-0.16, Math.min(0.16, turnRate * 260)) - s.lean) * Math.min(1, dt / 300);
      const P = pose.current;
      P.visible = e > 0.1;
      P.x = wx;
      P.y = wy + Math.sin(t * 0.0042) * 1.2 * e;
      P.s = L;
      P.ox = (90 - TILT) * DEG * e;
      P.oz = 0;
      P.my = Math.PI + dyaw * e;
      P.ix = s.lean * e + 0.045 * Math.sin(t * 0.0031);
      P.iz = 0.03 * Math.sin(t * 0.0037 + 1);
      invalidate.current();

      // the photo lies back into the pool plane and dissolves into the digital twin
      if (photoEl.current) {
        photoEl.current.style.opacity = (1 - e).toFixed(3);
        photoEl.current.style.transform = `perspective(950px) rotateX(${(TILT * e).toFixed(2)}deg) scale(${(1 - 0.08 * e).toFixed(4)})`;
        photoEl.current.style.filter = `saturate(${(1 - 0.5 * e).toFixed(3)}) brightness(${(1 - 0.35 * e).toFixed(3)})`;
      }
      if (svgEl.current) svgEl.current.style.opacity = e.toFixed(3);
      if (legend.current) legend.current.style.opacity = e.toFixed(3);
    }

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
        const q = path[((i - dir * k) % n + n) % n];
        d += `${k === from ? 'M' : 'L'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
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
      <div ref={stage} className={entry ? 'relative aspect-[800/400]' : 'relative'}>
      {entry && (
        <div ref={photoEl} className="absolute inset-0 overflow-hidden rounded" style={{ transformOrigin: '50% 55%' }}>
          <Image src={entry.photo} alt={entry.photoAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 760px" />
        </div>
      )}
      <div
        className={entry ? 'absolute inset-x-0 top-1/2 -translate-y-1/2' : 'relative'}
        style={entry ? { perspective: '950px', perspectiveOrigin: '50% 30%' } : undefined}
      >
      <svg
        ref={(el) => { svgEl.current = el; (frame as React.MutableRefObject<SVGSVGElement | null>).current = el; }}
        viewBox="0 0 800 480"
        className="relative w-full h-auto"
        style={
          entry
            ? { opacity: 0, transform: `rotateX(${TILT}deg) scale(${PLANE_SCALE})`, transformOrigin: '50% 55%' }
            : undefined
        }
        role="img"
        aria-label={labels.fused}
      >
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

        {entry && (
          <g clipPath={`url(#${clipId})`}>
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <path key={j} ref={(el) => { waterLines.current[j] = el; }} fill="none" stroke={C.blue} strokeOpacity="0.09" strokeWidth="1.2" />
            ))}
            <path ref={wakeOuterEl} fill="none" stroke={C.ink} strokeOpacity="0.22" strokeWidth="1.6" strokeLinejoin="round" />
            <path ref={wakeEl} fill="none" stroke={C.ink} strokeOpacity="0.6" strokeWidth="2.4" strokeLinejoin="round" />
            <ellipse ref={shadowEl} rx="46" ry="12" fill="#000" fillOpacity="0.5" />
            <circle ref={anchorEl} r="12" fill="none" opacity="0" />
          </g>
        )}

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

        {!entry && (
          <g ref={ship}>
            <polygon points="14,0 5,6 -11,6 -11,-6 5,-6" fill={C.ink} />
          </g>
        )}
      </svg>
      </div>
      {entry && (
        <div
          ref={spriteEl}
          className="pointer-events-none absolute left-0 top-0 will-change-transform"
          style={{ width: SPRITE_BASE, height: SPRITE_BASE / entry.spriteAspect, opacity: 0 }}
        >
          <Image src={entry.sprite} alt="" fill className="object-contain" sizes="400px" />
        </div>
      )}
      {entry && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <Overlay3D model="ship" pose={pose} onInvalidate={onInvalidate} />
        </div>
      )}
      </div>

      <figcaption ref={legend} style={entry ? { opacity: 0 } : undefined} className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 bg-brand-light" aria-hidden="true" />{labels.range}</span>
        <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-ink-muted" aria-hidden="true" />{labels.raw}</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 h-0.5 bg-ink" aria-hidden="true" />{labels.fused}</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 border border-ink-muted" aria-hidden="true" />{labels.marker}</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-2.5 bg-brand-light/20 border border-brand-light/40" aria-hidden="true" />{labels.camera}</span>
      </figcaption>
    </figure>
  );
}
