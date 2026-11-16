'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from './useFrame';
import { emptyPose, type Pose3D } from '@/components/three/pose';

const Overlay3D = dynamic(() => import('@/components/three/Overlay3D'), { ssr: false });

/*
 * The glider sits in its white frame as the real render. As the page scrolls on,
 * a 3D model of it lifts out of the frame, swings round in 3D and drops into the
 * water, then flies the way a glider does: it sinks and glides forward, rounds
 * out at depth, climbs, levels out at the surface to send its data, and at the
 * far end turns round and comes back. The matching step is highlighted below.
 */

const VB_W = 800;
const VB_H = 280;
const SURFACE = 54;
const BOTTOM = 232;
// two dives across the panel; the corners are rounded below
const CORNERS: [number, number][] = [
  [40, SURFACE], [220, BOTTOM], [400, SURFACE], [580, BOTTOM], [760, SURFACE],
];
const ROUND = 46; // corner rounding, viewBox units
const SPEED = 62; // glide speed on straight legs, viewBox units per second
const DWELL = 1600; // time at the surface sending data, ms
const GLIDER_IN_WATER = 150; // model length in the water, viewBox units
const DEG = Math.PI / 180;
const DIVE_YAW = 34 * DEG; // nose swung towards the viewer while diving
const CLIMB_YAW = -30 * DEG; // nose turned away while climbing
const BLUE = '#7aa6f0';
const INK = '#eceff3';
const MUTED = '#8b95a3';
const MARK = '#55636f';
const MONO = 'var(--font-mono), ui-monospace, monospace';

type StepKey = 'sink' | 'turn' | 'climb' | 'surface';
export type GliderSteps = Record<StepKey, { title: string; text: string }>;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const approach = (cur: number, target: number, dt: number, tau: number) => cur + (target - cur) * Math.min(1, dt / tau);

/** Rounded sawtooth: straight glides joined by quadratic curves, resampled every ~2 units. */
function buildPath() {
  const pts: [number, number][] = [CORNERS[0]];
  for (let i = 1; i < CORNERS.length - 1; i++) {
    const [px, py] = CORNERS[i - 1], [cx, cy] = CORNERS[i], [nx, ny] = CORNERS[i + 1];
    const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy);
    const a: [number, number] = [cx + ((px - cx) * ROUND) / l1, cy + ((py - cy) * ROUND) / l1];
    const b: [number, number] = [cx + ((nx - cx) * ROUND) / l2, cy + ((ny - cy) * ROUND) / l2];
    pts.push(a);
    for (let k = 1; k < 16; k++) {
      const t = k / 16;
      pts.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]);
    }
    pts.push(b);
  }
  pts.push(CORNERS[CORNERS.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const n = Math.round(total / 2);
  const out: [number, number][] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const d = (i / n) * total;
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    const u = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  // slower through the curves: speed factor from the local change of direction
  const speed = out.map((_, i) => {
    const a = out[Math.max(0, i - 3)], b = out[i], c = out[Math.min(out.length - 1, i + 3)];
    const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    const turn = Math.abs(Math.atan2(Math.sin(t2 - t1), Math.cos(t2 - t1)));
    return 1 - 0.55 * clamp(turn / 0.35);
  });
  // surface apexes, where it stops to send data: both ends and every top in between
  const apex = out.map(
    (p, i) =>
      i === 0 ||
      i === out.length - 1 ||
      (p[1] < SURFACE + 1.5 && out[Math.max(0, i - 1)][1] > p[1] && out[Math.min(out.length - 1, i + 1)][1] >= p[1]),
  );
  return { pts: out, speed, apex, d: 'M' + out.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') };
}

export default function GliderDive({
  alt,
  phases,
  steps,
  howTitle,
}: {
  alt: string;
  phases: { dive: string; climb: string; uplink: string };
  steps: GliderSteps;
  howTitle: string;
}) {
  const path = useMemo(buildPath, []);

  const frame = useRef<HTMLDivElement>(null);
  const still = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const wave = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPolylineElement>(null);
  const phase = useRef<SVGTextElement>(null);
  const arcs = useRef<(SVGPathElement | null)[]>([]);
  const ripples = useRef<(SVGEllipseElement | null)[]>([]);
  const stepEls = useRef<Record<StepKey, HTMLLIElement | null>>({ sink: null, turn: null, climb: null, surface: null });
  const pose = useRef<Pose3D>(emptyPose());
  const invalidate = useRef<() => void>(() => {});
  const onInvalidate = useCallback((fn: () => void) => {
    invalidate.current = fn;
  }, []);
  const st = useRef({
    reduce: false,
    active: '' as StepKey | '',
    lastT: 0,
    inWater: false,
    tEnter: 0,
    idx: 0,
    dir: 1,
    dwellUntil: 0,
    legStart: 0,
    carry: 0,
    pitch: 0,
    yaw: DIVE_YAW,
    roll: 0,
  });

  useEffect(() => {
    st.current.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const root = useFrame<HTMLDivElement>((t) => {
    const s = st.current;
    const R = root.current?.getBoundingClientRect();
    const F = frame.current?.getBoundingClientRect();
    const S = svg.current?.getBoundingClientRect();
    if (!R || !F || !S) return;
    const dt = Math.max(0, Math.min(100, t - s.lastT));
    s.lastT = t;

    // surface waves
    let d = '';
    for (let x = 0; x <= VB_W; x += 10) {
      d += `${x ? 'L' : 'M'}${x} ${(SURFACE + 2.5 * Math.sin(x * 0.045 + t * 0.0018)).toFixed(1)}`;
    }
    wave.current?.setAttribute('d', d);

    // scroll progress: 0 with the frame centred on screen, 1 with the water panel centred
    const vh = window.innerHeight;
    const fC = F.top + F.height / 2;
    const sC = S.top + S.height / 2;
    const p = s.reduce ? 0 : clamp((vh * 0.5 - fC) / (sC - fC));
    const e = ease(p);
    const k = S.width / VB_W;
    const toPx = (x: number, y: number): [number, number] => [S.left - R.left + x * k, S.top - R.top + y * k];
    const P = pose.current;

    const setStep = (key: StepKey | '') => {
      if (key === s.active) return;
      s.active = key;
      (Object.keys(stepEls.current) as StepKey[]).forEach((kk) => {
        stepEls.current[kk]?.setAttribute('data-active', kk === key ? 'true' : 'false');
      });
    };

    // the real render fades as the 3D model takes over
    if (still.current) still.current.style.opacity = (1 - clamp(e / 0.12)).toFixed(3);

    if (p < 1) {
      s.inWater = false;
      const [ex, ey] = toPx(path.pts[0][0], path.pts[0][1]);
      const fx = F.left - R.left + F.width / 2;
      const fy = F.top - R.top + F.height / 2;
      const fw = F.width * 0.78;
      const ew = GLIDER_IN_WATER * k;
      // frame pose matches the render: nose towards you, to the lower left
      const swayY = 0.12 * Math.sin(t * 0.0007);
      const swayR = 0.1 * Math.sin(t * 0.0011);
      const first = path.pts[6];
      const pitchIn = -Math.atan2(first[1] - path.pts[0][1], first[0] - path.pts[0][0]);
      P.visible = e > 0.03;
      P.x = fx + (ex - fx) * e;
      P.y = fy + (ey - fy) * e - Math.sin(Math.PI * e) * F.height * 0.35;
      P.s = fw + (ew - fw) * e;
      P.ox = 0;
      P.oz = 0.26 * (1 - e) + pitchIn * e;
      P.my = (-148 * DEG + swayY) * (1 - e) + DIVE_YAW * e;
      P.ix = swayR * (1 - e) + Math.sin(Math.PI * e) * 0.7;
      P.iz = 0;
      s.pitch = P.oz;
      s.yaw = P.my;
      s.roll = 0;
      trail.current?.setAttribute('points', '');
      if (phase.current) phase.current.textContent = '';
      arcs.current.forEach((el) => el?.setAttribute('stroke-opacity', '0'));
      ripples.current.forEach((el) => el?.setAttribute('stroke-opacity', '0'));
      setStep('');
      invalidate.current();
      return;
    }

    // ---- in the water ----
    if (!s.inWater) {
      s.inWater = true;
      s.tEnter = t;
      s.idx = 0;
      s.dir = 1;
      s.dwellUntil = 0;
      s.legStart = 0;
      s.carry = 0;
    }
    const n = path.pts.length;
    if (s.dwellUntil <= t) {
      // move along the path (carrying the remainder between frames), slower through the curves
      s.carry += ((SPEED * dt) / 1000) * path.speed[s.idx];
      for (;;) {
        const next = s.idx + s.dir;
        if (next < 0 || next >= n) {
          s.carry = 0;
          break;
        }
        const stepLen = Math.hypot(path.pts[next][0] - path.pts[s.idx][0], path.pts[next][1] - path.pts[s.idx][1]);
        if (s.carry < stepLen) break;
        s.carry -= stepLen;
        s.idx = next;
        if (path.apex[s.idx] && t - s.tEnter > 500) {
          s.dwellUntil = t + DWELL;
          s.carry = 0;
          // at either end it turns round for the way back
          if (s.idx === 0 || s.idx === n - 1) s.dir = -s.dir;
          s.legStart = s.idx;
          break;
        }
      }
    }
    // position between this sample and the next, for smooth motion
    const nextIdx = clamp(s.idx + s.dir, 0, n - 1);
    const segLen = Math.hypot(path.pts[nextIdx][0] - path.pts[s.idx][0], path.pts[nextIdx][1] - path.pts[s.idx][1]) || 1;
    const fu = s.dwellUntil > t ? 0 : clamp(s.carry / segLen);
    const vx = path.pts[s.idx][0] + (path.pts[nextIdx][0] - path.pts[s.idx][0]) * fu;
    const vy = path.pts[s.idx][1] + (path.pts[nextIdx][1] - path.pts[s.idx][1]) * fu;
    const ahead = path.pts[clamp(s.idx + s.dir * 4, 0, n - 1)];
    const dy = ahead[1] - vy;
    const ax = Math.abs(ahead[0] - vx) || 1;
    const resting = s.dwellUntil > t;
    const descending = !resting && dy > 0.3;
    const climbing = !resting && dy < -0.3;
    const nearBottom = vy > BOTTOM - 30;

    // attitude: follow the curve; nose towards you on the way down, away on the way up
    const pitchTarget = resting ? 0 : s.dir > 0 ? -Math.atan2(dy, ax) : Math.atan2(dy, ax);
    const baseYaw = s.dir > 0 ? 0 : Math.PI;
    const yawOffset = descending ? DIVE_YAW : climbing ? CLIMB_YAW : 0;
    let yawTarget = baseYaw + (s.dir > 0 ? yawOffset : -yawOffset);
    while (yawTarget - s.yaw > Math.PI) yawTarget -= Math.PI * 2;
    while (yawTarget - s.yaw < -Math.PI) yawTarget += Math.PI * 2;
    s.pitch = approach(s.pitch, pitchTarget, dt, 350);
    const prevYaw = s.yaw;
    s.yaw = approach(s.yaw, yawTarget, dt, resting ? 650 : 900);
    // bank into changes of heading, plus a slow sway
    const yawRate = dt > 0 ? (s.yaw - prevYaw) / dt : 0;
    s.roll = approach(s.roll, clamp(-yawRate * 900, -0.5, 0.5), dt, 300);
    const bob = resting ? Math.sin(t * 0.004) * 2.2 : 0;

    const [px, py] = toPx(vx, vy);
    P.visible = true;
    P.x = px;
    P.y = py + bob * k;
    P.s = GLIDER_IN_WATER * k;
    P.ox = 0;
    P.oz = s.pitch + (resting ? 0.05 * Math.sin(t * 0.003) : 0);
    P.my = s.yaw;
    P.ix = s.roll + 0.08 * Math.sin(t * 0.0009);
    P.iz = 0;
    invalidate.current();

    // trail of the current leg
    const from = Math.min(s.legStart, s.idx), to = Math.max(s.legStart, s.idx);
    let pts = '';
    for (let i = from; i <= to; i += 2) pts += `${path.pts[i][0].toFixed(1)},${path.pts[i][1].toFixed(1)} `;
    trail.current?.setAttribute('points', pts + `${vx.toFixed(1)},${vy.toFixed(1)}`);

    const step: StepKey = resting ? 'surface' : nearBottom ? 'turn' : descending ? 'sink' : 'climb';
    setStep(step);
    if (phase.current) {
      phase.current.textContent = resting ? phases.uplink : descending ? phases.dive : phases.climb;
      phase.current.setAttribute('x', (vx + (s.dir > 0 ? 70 : -150)).toFixed(1));
      phase.current.setAttribute('y', (resting ? vy - 26 : vy + 4).toFixed(1));
      phase.current.setAttribute('fill', resting ? BLUE : MUTED);
    }
    arcs.current.forEach((el, i) => {
      if (!el) return;
      if (!resting) {
        el.setAttribute('stroke-opacity', '0');
        return;
      }
      const q = (t / 900 + i / 3) % 1;
      const r = 10 + q * 26;
      el.setAttribute('d', `M${(vx - r).toFixed(1)} ${SURFACE - 10}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(vx + r).toFixed(1)} ${SURFACE - 10}`);
      el.setAttribute('stroke-opacity', (1 - q).toFixed(2));
    });
    const since = t - s.tEnter;
    ripples.current.forEach((el, i) => {
      if (!el) return;
      const q = clamp((since - i * 180) / 1100);
      el.setAttribute('rx', (8 + q * 60).toFixed(1));
      el.setAttribute('ry', (2 + q * 9).toFixed(1));
      el.setAttribute('stroke-opacity', (q >= 1 ? 0 : (1 - q) * 0.9).toFixed(2));
    });
  }, 0);

  const order: StepKey[] = ['sink', 'turn', 'climb', 'surface'];

  return (
    <div ref={root} className="relative">
      {/* the frame, with the real render while the glider is at rest */}
      <div ref={frame} className="relative aspect-[16/8] sm:aspect-[16/7] rounded bg-white">
        <div className="absolute inset-[9%] opacity-[0.05] grayscale" aria-hidden="true">
          <Image src="/images/projects/glider-cutout.png" alt="" fill className="object-contain" sizes="800px" />
        </div>
        <div ref={still} className="absolute inset-[9%]">
          <Image src="/images/projects/glider-cutout.png" alt={alt} fill className="object-contain" sizes="(max-width: 1360px) 90vw, 1100px" />
        </div>
      </div>

      {/* the water */}
      <div className="mt-3 rounded bg-[#0f151c] p-5 sm:p-8">
        <svg ref={svg} viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" aria-hidden="true">
          <defs>
            <linearGradient id="glider-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#14283a" />
              <stop offset="1" stopColor="#0b141d" />
            </linearGradient>
          </defs>
          <rect x="0" y={SURFACE} width={VB_W} height={VB_H - SURFACE} fill="url(#glider-water)" />
          <g stroke={MARK} strokeWidth="1" strokeDasharray="3 6">
            <line x1="0" y1="113" x2={VB_W} y2="113" />
            <line x1="0" y1="172" x2={VB_W} y2="172" />
            <line x1="0" y1={BOTTOM} x2={VB_W} y2={BOTTOM} />
          </g>
          <path ref={wave} fill="none" stroke={BLUE} strokeWidth="1.5" />
          <path d={path.d} fill="none" stroke={MARK} strokeWidth="1.2" strokeDasharray="5 6" />
          <polyline ref={trail} fill="none" stroke={INK} strokeOpacity="0.7" strokeWidth="2" strokeLinejoin="round" />
          {[0, 1].map((i) => (
            <ellipse key={i} ref={(el) => { ripples.current[i] = el; }} cx={CORNERS[0][0]} cy={SURFACE} rx="0" ry="0" fill="none" stroke={INK} strokeWidth="1.5" strokeOpacity="0" />
          ))}
          {[0, 1, 2].map((i) => (
            <path key={i} ref={(el) => { arcs.current[i] = el; }} fill="none" stroke={BLUE} strokeWidth="1.5" strokeOpacity="0" />
          ))}
          <text ref={phase} fontSize="12" fontFamily={MONO} fill={MUTED} />
        </svg>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[#8b95a3]">{howTitle}</p>
        <ol className="mt-3 grid gap-px bg-[#232c36] sm:grid-cols-2 lg:grid-cols-4 rounded overflow-hidden">
          {order.map((key, i) => (
            <li
              key={key}
              ref={(el) => { stepEls.current[key] = el; }}
              data-active="false"
              className="group bg-[#0f151c] p-4 transition-colors duration-500 data-[active=true]:bg-[#16222e]"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8b95a3] group-data-[active=true]:text-[#7aa6f0]">
                0{i + 1} · {steps[key].title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#9eacb9] group-data-[active=true]:text-[#eceff3] transition-colors duration-500">
                {steps[key].text}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* the 3D glider, above both panels */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <Overlay3D model="glider" pose={pose} onInvalidate={onInvalidate} />
      </div>
    </div>
  );
}
