'use client';

import { useEffect, useRef } from 'react';

/**
 * Runs `draw(timeMs)` on every animation frame while the element is on screen.
 * With prefers-reduced-motion it draws one still frame at `stillAt` ms and stops.
 * Returns a ref for the element whose visibility gates the loop.
 */
export function useFrame<T extends Element>(draw: (t: number) => void, stillAt = 6000) {
  const ref = useRef<T>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      drawRef.current(stillAt);
      return;
    }

    let raf = 0;
    let visible = false;
    let start = 0;
    let pausedAt = 0;

    const loop = (now: number) => {
      if (!start) start = now - pausedAt;
      drawRef.current(now - start);
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        start = 0;
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting && visible) {
        visible = false;
        cancelAnimationFrame(raf);
        pausedAt = performance.now() - start;
      }
    });
    io.observe(el);
    drawRef.current(0);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [stillAt]);

  return ref;
}

/** Closed Catmull-Rom spline through `pts`, resampled to `n` points evenly spaced by arc length. */
export function closedSpline(pts: [number, number][], n = 600): [number, number][] {
  const dense: [number, number][] = [];
  const m = pts.length;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1], b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[cum.length - 1];
  const out: [number, number][] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / n) * total;
    while (cum[j + 1] < target) j++;
    const a = dense[j], b = dense[(j + 1) % dense.length];
    const u = (target - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}

/** Small deterministic pseudo-random generator so server and client agree. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
