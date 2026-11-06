'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Live data and forecasts from the LakeLink server (FastAPI, read-only, CORS-enabled for d7tech.net).
 * Everything is fetched in the browser, so the page itself stays static.
 * Layout follows the usual weather-site pattern: "now" panel, hourly forecast strip, then details.
 */
const API = process.env.NEXT_PUBLIC_WEATHER_API ?? 'https://api.d7tech.net/api/v1';
const STATION = 1;
const TZ = 'Europe/Istanbul';
const HOUR = 3600_000;
const REFRESH_MS = 60_000;
const CALM_MS = 0.3; // below this the wind vane just rests where it last stopped, so no direction is shown

type Latest = {
  measured_at: string;
  temp_c: number | null;
  rh_pct: number | null;
  press_hpa: number | null;
  wind_ms: number | null;
  gust_ms: number | null;
  wind_dir_deg: number | null;
  rain_total_mm: number | null;
  soil_pct: number | null;
};
type Bin = {
  bin_start: string;
  n: number;
  temp_c: number | null;
  rh_pct: number | null;
  press_hpa: number | null;
  wind_ms: number | null;
  gust_ms: number | null;
  wind_dir_deg: number | null;
  rain_mm: number | null;
};
type Pred = { method: string; issued_at: string; valid_at: string; value: number; lo: number | null; hi: number | null };
type Metric = { method: string; horizon_h: number; n: number; mae: number | null; brier: number | null; skill_vs_persistence: number | null };
type Weight = { horizon_h: number; method: string; weight: number };
type ModelStatus = { method: string; trained_at: string; ready: boolean; note: string | null };

type Variable = 'wind_ms' | 'gust_ms' | 'rain_mm' | 'rain_prob' | 'wind_dir_deg';
const VARIABLES: Variable[] = ['wind_ms', 'gust_ms', 'rain_prob', 'rain_mm', 'wind_dir_deg'];
const UNIT: Record<Variable, string> = { wind_ms: 'm/s', gust_ms: 'm/s', rain_mm: 'mm', rain_prob: '%', wind_dir_deg: '°' };

type Group = 'single' | 'hybrid' | 'online';
const GROUPS: Record<Group, string[]> = {
  single: ['single-lgbm', 'single-sarima'],
  hybrid: ['hybrid-lgbm', 'hybrid-sarimax'],
  online: ['online-river', 'online'],
};
const BASELINES = ['persistence', 'nwp'];
const ALL_METHODS = [...GROUPS.single, ...GROUPS.hybrid, ...GROUPS.online, ...BASELINES];
const COLOR: Record<string, string> = {
  observed: '#e2e8f0',
  persistence: '#64748b',
  nwp: '#f59e0b',
  'single-lgbm': '#38bdf8',
  'single-sarima': '#a78bfa',
  'hybrid-lgbm': '#34d399',
  'hybrid-sarimax': '#f472b6',
  'online-river': '#fb923c',
  online: '#facc15',
};
const SARIMA_VARS: Variable[] = ['wind_ms', 'gust_ms', 'rain_mm'];
/** Forecast sources offered in the hourly strip, best first. */
const SOURCES = ['online', 'hybrid-lgbm', 'single-lgbm', 'nwp'];

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function fmt(v: number | null | undefined, digits = 1) {
  return v === null || v === undefined || Number.isNaN(v) ? '–' : v.toFixed(digits);
}

function compass(deg: number | null | undefined) {
  if (deg === null || deg === undefined) return '–';
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return names[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Beaufort-style description of a wind speed (m/s). */
function windWord(ms: number | null | undefined) {
  if (ms === null || ms === undefined) return null;
  const steps: [number, string][] = [[0.5, 'calm'], [1.6, 'lightAir'], [3.4, 'lightBreeze'], [5.5, 'gentleBreeze'],
    [8, 'moderateBreeze'], [10.8, 'freshBreeze'], [13.9, 'strongBreeze'], [Infinity, 'gale']];
  return steps.find(([lim]) => ms < lim)![1];
}

/** Cell colour for a wind speed, light to strong (as on wind-forecast tables). */
function windBg(ms: number | null) {
  if (ms === null) return 'transparent';
  const stops: [number, string][] = [[1, '#0f172a'], [2, '#0c4a6e'], [4, '#0e7490'], [6, '#047857'], [8, '#4d7c0f'],
    [11, '#a16207'], [14, '#c2410c'], [Infinity, '#b91c1c']];
  return stops.find(([lim]) => ms < lim)![1];
}

function valueAt(ps: Pred[] | undefined, method: string, h: number) {
  const mine = (ps ?? []).filter((p) => p.method === method);
  if (!mine.length) return null;
  const target = Date.parse(mine[0].issued_at) + h * HOUR;
  return mine.find((p) => Date.parse(p.valid_at) === target)?.value ?? null;
}

/** 10-minute bins -> hourly values with the server's convention: valid_at T covers the hour (T-1h, T]. */
function hourly(bins: Bin[]) {
  const groups = new Map<number, Bin[]>();
  for (const b of bins) {
    const t = Math.floor(Date.parse(b.bin_start) / HOUR) * HOUR + HOUR;
    groups.set(t, [...(groups.get(t) ?? []), b]);
  }
  const out = new Map<number, Partial<Record<Variable, number>>>();
  groups.forEach((bs, t) => {
    if (bs.length < 4) return;
    const mean = (xs: (number | null)[]) => {
      const v = xs.filter((x): x is number => x !== null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
    };
    const gusts = bs.map((b) => b.gust_ms).filter((x): x is number => x !== null);
    const rains = bs.map((b) => b.rain_mm).filter((x): x is number => x !== null);
    const rain = rains.length ? rains.reduce((a, b) => a + b, 0) : undefined;
    out.set(t, {
      wind_ms: mean(bs.map((b) => b.wind_ms)),
      gust_ms: gusts.length ? Math.max(...gusts) : undefined,
      rain_mm: rain,
      rain_prob: rain === undefined ? undefined : rain >= 0.1 ? 100 : 0,
      wind_dir_deg: bs.find((b) => b.wind_dir_deg !== null)?.wind_dir_deg ?? undefined,
    });
  });
  return out;
}

/** Draws a dot only for points whose neighbours are missing, so single readings between gaps stay visible. */
function loneDot(data: Record<string, unknown>[], key: string, color: string) {
  const LoneDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const i = props.index ?? 0;
    const has = (j: number) => j >= 0 && j < data.length && data[j][key] !== null && data[j][key] !== undefined;
    if (props.cx === undefined || props.cy === undefined || !has(i) || has(i - 1) || has(i + 1)) return <g key={i} />;
    return <circle key={i} cx={props.cx} cy={props.cy} r={2.5} fill={color} />;
  };
  return LoneDot;
}

const axisNum = (v: number) => Number(v.toFixed(Math.abs(v) >= 100 ? 0 : Math.abs(v) < 1 ? 2 : 1)).toString();

/** Arrow pointing where the wind blows to (meteorological direction = where it comes from). */
function Arrow({ deg, size = 16, color = '#e2e8f0' }: { deg: number | null; size?: number; color?: string }) {
  if (deg === null || deg === undefined) return <span className="text-slate-600">–</span>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${deg + 180}deg)` }} aria-label={compass(deg)}>
      <path d="M12 2 L18 20 L12 16 L6 20 Z" fill={color} />
    </svg>
  );
}

function Compass({ deg, speed }: { deg: number | null; speed: string }) {
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#1a2540" strokeWidth="2" />
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1="50" y1="6" x2="50" y2={i % 4 === 0 ? 13 : 10} stroke="#334155" strokeWidth="1.5" transform={`rotate(${i * 22.5} 50 50)`} />
        ))}
        {(['N', 'E', 'S', 'W'] as const).map((n, i) => (
          <text key={n} x="50" y="23" textAnchor="middle" fontSize="9" fill="#64748b" transform={`rotate(${i * 90} 50 50)`}>{n}</text>
        ))}
        {deg !== null && (
          <g transform={`rotate(${deg} 50 50)`}>
            <path d="M50 8 L56 22 L50 19 L44 22 Z" fill="#38bdf8" />
          </g>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-slate-100 tabular-nums leading-none">{speed}</span>
        <span className="text-[10px] text-slate-500 mt-1">m/s</span>
      </div>
    </div>
  );
}

export default function WeatherDashboard() {
  const t = useTranslations('MicroClimatePage.dashboard');
  const locale = useLocale();
  const [latest, setLatest] = useState<Latest | null | undefined>(undefined);
  const [bins, setBins] = useState<Bin[]>([]);
  const [range, setRange] = useState<24 | 168 | 720>(24);
  const [variable, setVariable] = useState<Variable>('wind_ms');
  const [group, setGroup] = useState<Group>('single');
  const [fc, setFc] = useState<Partial<Record<Variable, Pred[]>>>({});
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [windowDays, setWindowDays] = useState<7 | 30>(7);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const timeFmt = useMemo(() => new Intl.DateTimeFormat(locale, { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }), [locale]);
  const hourFmt = useMemo(() => new Intl.DateTimeFormat(locale, { timeZone: TZ, hour: '2-digit', hour12: false }), [locale]);
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', hour12: false }), [locale]);
  const weekdayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { timeZone: TZ, weekday: 'short', day: 'numeric' }), [locale]);

  const loadLive = useCallback(async () => {
    const [l, s, m] = await Promise.all([
      getJson<Latest>(`/latest?station=${STATION}`),
      getJson<{ rows: Bin[] }>(`/series?station=${STATION}&hours=${Math.max(range, 48)}`),
      getJson<ModelStatus[]>(`/models?station=${STATION}`),
    ]);
    setLatest(l);
    setBins(s?.rows ?? []);
    setModels(m ?? []);
    setNow(Date.now());
  }, [range]);

  const loadForecasts = useCallback(async () => {
    const res = await Promise.all(VARIABLES.map((v) => getJson<Pred[]>(`/forecast?station=${STATION}&variable=${v}`)));
    setFc(Object.fromEntries(VARIABLES.map((v, i) => [v, res[i] ?? []])));
  }, []);

  const loadWeights = useCallback(async () => {
    setWeights((await getJson<Weight[]>(`/online_weights?station=${STATION}&variable=${variable}`)) ?? []);
  }, [variable]);

  const loadMetrics = useCallback(async () => {
    setMetrics((await getJson<Metric[]>(`/metrics?station=${STATION}&variable=${variable}&window_days=${windowDays}`)) ?? []);
  }, [variable, windowDays]);

  useEffect(() => {
    loadLive();
    const id = setInterval(loadLive, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadLive]);
  useEffect(() => {
    loadForecasts();
    const id = setInterval(loadForecasts, REFRESH_MS * 5);
    return () => clearInterval(id);
  }, [loadForecasts]);
  useEffect(() => {
    loadWeights();
  }, [loadWeights]);
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // ---- hourly strip: the chosen (default: best available) forecast for the next 24 hours ----
  const available = SOURCES.filter((m) => (fc.wind_ms ?? []).some((p) => p.method === m));
  const src = source && available.includes(source) ? source : available[0];
  const strip = useMemo(() => {
    if (!src) return [];
    const issued = (fc.wind_ms ?? []).find((p) => p.method === src)?.issued_at;
    if (!issued) return [];
    return Array.from({ length: 24 }, (_, i) => {
      const h = i + 1;
      const pick = (v: Variable) => valueAt(fc[v], src, h) ?? (v === 'rain_prob' || v === 'wind_dir_deg' ? valueAt(fc[v], 'nwp', h) : null);
      return { at: Date.parse(issued) + h * HOUR, wind: pick('wind_ms'), gust: pick('gust_ms'), dir: pick('wind_dir_deg'),
        prob: pick('rain_prob'), mm: pick('rain_mm') };
    });
  }, [fc, src]);

  // ---- history charts: one point per 10-minute bin, nulls where a bin is missing (drawn as gaps) ----
  const history = useMemo(() => {
    const end = Math.floor(now / 600_000) * 600_000;
    const start = end - range * HOUR;
    const byTime = new Map(bins.map((b) => [Date.parse(b.bin_start), b]));
    const step = range > 168 ? 3600_000 : 600_000;
    const rows: { t: number; wind: number | null; gust: number | null; temp: number | null; rain: number | null }[] = [];
    for (let s = Math.ceil(start / step) * step; s <= end; s += step) {
      const g = step === 600_000 ? ([byTime.get(s)].filter(Boolean) as Bin[]) :
        (Array.from({ length: 6 }, (_, i) => byTime.get(s + i * 600_000)).filter(Boolean) as Bin[]);
      const avg = (k: keyof Bin) => {
        const v = g.map((b) => b[k] as number | null).filter((x): x is number => x !== null);
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      };
      const gusts = g.map((b) => b.gust_ms).filter((x): x is number => x !== null);
      const rains = g.map((b) => b.rain_mm).filter((x): x is number => x !== null);
      rows.push({ t: s, wind: avg('wind_ms'), gust: gusts.length ? Math.max(...gusts) : null, temp: avg('temp_c'),
        rain: rains.length ? rains.reduce((a, b) => a + b, 0) : null });
    }
    return rows;
  }, [bins, range, now]);

  const rainToday = useMemo(() => {
    const day = 24 * HOUR; // Istanbul is UTC+3 all year
    const start = Math.floor((now + 3 * HOUR) / day) * day - 3 * HOUR;
    return bins.filter((b) => Date.parse(b.bin_start) >= start).reduce((a, b) => a + (b.rain_mm ?? 0), 0);
  }, [bins, now]);
  const tempRange = useMemo(() => {
    const v = bins.filter((b) => Date.parse(b.bin_start) >= now - 24 * HOUR).map((b) => b.temp_c).filter((x): x is number => x !== null);
    return v.length ? [Math.min(...v), Math.max(...v)] : null;
  }, [bins, now]);

  // ---- model comparison chart ----
  const preds = fc[variable] ?? [];
  const scale = variable === 'rain_prob' ? 100 : 1;
  const obsHourly = useMemo(() => hourly(bins), [bins]);
  const shown = [...GROUPS[group], ...BASELINES];
  const forecastRows = useMemo(() => {
    const rows = new Map<number, Record<string, number | null>>();
    const nowH = Math.floor(now / HOUR) * HOUR;
    for (let h = -24; h <= 25; h++) rows.set(nowH + h * HOUR, {});
    obsHourly.forEach((v, tt) => {
      const r = rows.get(tt);
      if (r && v[variable] !== undefined) r.observed = v[variable] as number;
    });
    for (const p of preds) {
      const tt = Date.parse(p.valid_at);
      if (!rows.has(tt)) rows.set(tt, {});
      rows.get(tt)![p.method] = p.value * scale;
    }
    return Array.from(rows.entries()).sort((a, b) => a[0] - b[0]).map(([tt, r]) => ({ t: tt, ...r }));
  }, [obsHourly, preds, variable, scale, now]);
  const methodsWithData = new Set(preds.map((p) => p.method));

  const statusOf = (m: string) => {
    const status = models.find((x) => x.method === m);
    if (m.includes('sarima') && !SARIMA_VARS.includes(variable)) return t('status.notForVariable');
    if (methodsWithData.has(m)) return t('status.ready');
    if (m === 'online-river') return t('status.warmingUp');
    if (m === 'online') return t('status.blendWaiting');
    if (status && !status.ready) return /not enough data/.test(status.note ?? '') ? t('status.needsWeek') : status.note ?? '';
    if (status?.ready) return t('status.nextHour');
    return t('status.none');
  };

  const metricFor = (method: string, h: number) => metrics.find((m) => m.method === method && m.horizon_h === h);
  const headline = (m?: Metric) => (variable === 'rain_prob' ? m?.brier : m?.mae);

  const ago = latest ? Math.round((now - Date.parse(latest.measured_at)) / 60_000) : null;
  const live = ago !== null && ago <= 15;
  const tick = (v: number) => (range > 24 ? dayFmt.format(v) : timeFmt.format(v));
  const ww = windWord(latest?.wind_ms);
  const calm = (latest?.wind_ms ?? 0) < CALM_MS && (latest?.gust_ms ?? 0) < CALM_MS;
  const dirNow = calm ? null : latest?.wind_dir_deg ?? null;

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full border text-xs transition-colors ${
      active ? 'border-sky-400/60 bg-sky-400/10 text-sky-300' : 'border-[#1a2540] text-slate-400 hover:text-slate-200'
    }`;
  const card = 'rounded-lg border border-[#1a2540] bg-[#0a0f1e]/70';
  const h2 = 'text-lg font-semibold text-slate-100';

  return (
    <div className="space-y-10">
      {/* ---------- now ---------- */}
      <section aria-labelledby="now-heading" className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 id="now-heading" className={h2}>{t('nowTitle')}</h2>
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-400 pulse-dot' : 'bg-amber-400'}`} aria-hidden="true" />
            {latest === undefined ? t('loading') : latest === null ? t('noData')
              : live ? t('updated', { minutes: ago ?? 0 }) : t('offline', { time: dayFmt.format(Date.parse(latest.measured_at)) })}
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <div className="text-6xl font-semibold text-slate-100 tabular-nums leading-none">
              {fmt(latest?.temp_c)}<span className="text-3xl text-slate-400 align-top ml-1">°C</span>
            </div>
            {tempRange && (
              <div className="text-sm text-slate-500 mt-2 tabular-nums">{t('range24', { min: fmt(tempRange[0]), max: fmt(tempRange[1]) })}</div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Compass deg={dirNow} speed={fmt(latest?.wind_ms)} />
            <div className="text-sm">
              <div className="text-slate-100 font-medium">{ww ? t(`wind.${ww}` as any) : '–'}</div>
              <div className="text-slate-400 tabular-nums">{dirNow === null ? t('noDirection') : t('from', { dir: compass(dirNow) })}</div>
              <div className="text-slate-400 tabular-nums">{t('gustNow', { gust: fmt(latest?.gust_ms) })}</div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['rainToday', `${fmt(rainToday)} mm`],
              ['humidity', `${fmt(latest?.rh_pct, 0)} %`],
              ['pressure', `${fmt(latest?.press_hpa, 0)} hPa`],
              ['soil', `${fmt(latest?.soil_pct, 0)} %`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{t(`tiles.${k}` as any)}</dt>
                <dd className="text-slate-100 font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-[11px] text-slate-600 mt-4">{t('rawNote')}</p>
      </section>

      {/* ---------- next 24 hours, hour by hour ---------- */}
      <section aria-labelledby="hourly-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 id="hourly-heading" className={h2}>{t('hourlyTitle')}</h2>
          {available.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('sourceLabel')}>
              {available.map((m) => (
                <button key={m} className={chip(m === src)} onClick={() => setSource(m)} aria-pressed={m === src}>
                  {t(`methods.${m}` as any)}
                </button>
              ))}
            </div>
          )}
        </div>
        {strip.length === 0 ? (
          <p className="text-sm text-slate-500">{t('status.none')}</p>
        ) : (
          <div className={`${card} overflow-x-auto`}>
            <table className="text-xs tabular-nums border-collapse min-w-max w-full">
              <tbody>
                <tr className="text-slate-500">
                  <th className="sticky left-0 z-10 bg-[#0a0f1e] text-left font-normal px-3 py-2 min-w-[92px]" />
                  {strip.map((r, i) => {
                    const newDay = i === 0 || hourFmt.format(r.at) === '00';
                    return (
                      <th key={r.at} className={`font-normal px-1 pt-2 text-center min-w-[42px] ${newDay ? 'border-l border-[#1a2540]' : ''}`}>
                        <div className="text-[10px] text-slate-600 h-3">{newDay ? weekdayFmt.format(r.at) : ''}</div>
                        <div className="text-slate-300">{hourFmt.format(r.at)}</div>
                      </th>
                    );
                  })}
                </tr>
                <StripRow label={t('rows.wind')} cells={strip.map((r) => ({ k: r.at, v: fmt(r.wind), bg: windBg(r.wind) }))} />
                <StripRow label={t('rows.gust')} cells={strip.map((r) => ({ k: r.at, v: fmt(r.gust), bg: windBg(r.gust) }))} />
                <tr>
                  <th className="sticky left-0 z-10 bg-[#0a0f1e] text-left font-normal text-slate-500 px-3 py-2">{t('rows.dir')}</th>
                  {strip.map((r) => (
                    <td key={r.at} className="text-center py-2"><span className="inline-flex justify-center"><Arrow deg={r.dir} size={14} /></span></td>
                  ))}
                </tr>
                <StripRow label={t('rows.rainProb')} cells={strip.map((r) => {
                  const pct = r.prob === null ? null : Math.round(r.prob * 100);
                  return { k: r.at, v: pct === null ? '–' : `${pct}`, bg: pct === null ? 'transparent' : `rgba(56,189,248,${Math.min(pct, 100) / 110})` };
                })} />
                <StripRow label={t('rows.rainMm')} cells={strip.map((r) => ({ k: r.at, v: r.mm === null ? '–' : r.mm < 0.05 ? '0' : fmt(r.mm), bg: 'transparent' }))} />
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">{src ? t('hourlyNote', { method: t(`methods.${src}` as any) }) : ''}</p>
      </section>

      {/* ---------- measured ---------- */}
      <section aria-labelledby="history-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 id="history-heading" className={h2}>{t('historyTitle')}</h2>
          <div className="flex gap-2" role="group" aria-label={t('historyTitle')}>
            {([24, 168, 720] as const).map((r) => (
              <button key={r} className={chip(range === r)} onClick={() => setRange(r)} aria-pressed={range === r}>
                {t(`range.${r}` as any)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ChartCard title={t('charts.wind')} card={`${card} md:col-span-3`}>
            <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#1a2540" vertical={false} />
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={tick} stroke="#475569" fontSize={11} minTickGap={40} />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} />
              <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit="m/s" />} />
              <Line dataKey="gust" name={t('series.gust')} stroke="#38bdf8" strokeOpacity={0.45} dot={loneDot(history, 'gust', '#38bdf880')} isAnimationActive={false} connectNulls={false} />
              <Line dataKey="wind" name={t('series.wind')} stroke="#38bdf8" strokeWidth={2} dot={loneDot(history, 'wind', '#38bdf8')} isAnimationActive={false} connectNulls={false} />
            </LineChart>
          </ChartCard>
          <ChartCard title={t('charts.temp')} card={`${card} md:col-span-2`} height={170}>
            <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#1a2540" vertical={false} />
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={tick} stroke="#475569" fontSize={11} minTickGap={40} />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} domain={['auto', 'auto']} />
              <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit="°C" />} />
              <Line dataKey="temp" name={t('series.temp')} stroke="#fb923c" strokeWidth={2} dot={loneDot(history, 'temp', '#fb923c')} isAnimationActive={false} connectNulls={false} />
            </LineChart>
          </ChartCard>
          <ChartCard title={t('charts.rain')} card={card} height={170}>
            <BarChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#1a2540" vertical={false} />
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={tick} stroke="#475569" fontSize={11} minTickGap={40} />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} allowDecimals />
              <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit="mm" />} />
              <Bar dataKey="rain" name={t('series.rain')} fill="#38bdf8" isAnimationActive={false} />
            </BarChart>
          </ChartCard>
        </div>
      </section>

      {/* ---------- compare the models ---------- */}
      <section aria-labelledby="compare-heading">
        <h2 id="compare-heading" className={`${h2} mb-3`}>{t('compareTitle')}</h2>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('variableLabel')}>
            {VARIABLES.map((v) => (
              <button key={v} className={chip(variable === v)} onClick={() => setVariable(v)} aria-pressed={variable === v}>
                {t(`variables.${v}` as any)}
              </button>
            ))}
          </div>
          <span className="w-px h-5 bg-[#1a2540] mx-1 hidden sm:block" aria-hidden="true" />
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('groupLabel')}>
            {(Object.keys(GROUPS) as Group[]).map((g) => (
              <button key={g} role="tab" aria-selected={group === g} className={chip(group === g)} onClick={() => setGroup(g)}>
                {t(`groups.${g}` as any)}
              </button>
            ))}
          </div>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs">
            <Legend color={COLOR.observed} label={t('series.observed')} />
            {shown.map((m) => (
              <Legend key={m} color={COLOR[m]} label={t(`methods.${m}` as any)} dashed={BASELINES.includes(m)} muted={!methodsWithData.has(m)}
                title={BASELINES.includes(m) ? undefined : statusOf(m)} />
            ))}
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastRows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#1a2540" vertical={false} />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={(v) => timeFmt.format(v)} stroke="#475569" fontSize={11} minTickGap={40} />
                <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} domain={variable === 'wind_dir_deg' ? [0, 360] : variable === 'rain_prob' ? [0, 100] : [0, 'auto']} />
                <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit={UNIT[variable]} names={(k) => (k === 'observed' ? t('series.observed') : t(`methods.${k}` as any))} />} />
                <ReferenceLine x={now} stroke="#334155" strokeDasharray="3 3" label={{ value: t('now'), fill: '#64748b', fontSize: 10, position: 'insideTopRight' }} />
                <Line dataKey="observed" stroke={COLOR.observed} strokeWidth={2} dot={loneDot(forecastRows, 'observed', COLOR.observed)} isAnimationActive={false} connectNulls={false} />
                {shown.map((m) => (
                  <Line key={m} dataKey={m} stroke={COLOR[m]} strokeWidth={BASELINES.includes(m) ? 1.5 : 2}
                    strokeDasharray={BASELINES.includes(m) ? '5 4' : undefined} dot={false} isAnimationActive={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {GROUPS[group].map((m) => (
              <div key={m} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR[m] }} aria-hidden="true" />
                <span className="text-slate-300">{t(`methods.${m}` as any)}</span>
                <span className="text-slate-500">· {statusOf(m)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- accuracy + blend ---------- */}
      <section aria-labelledby="accuracy-heading" className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
            <h2 id="accuracy-heading" className={h2}>{t('accuracyTitle', { variable: t(`variables.${variable}` as any) })}</h2>
            <div className="flex gap-2" role="group">
              {([7, 30] as const).map((d) => (
                <button key={d} className={chip(windowDays === d)} onClick={() => setWindowDays(d)} aria-pressed={windowDays === d}>
                  {t('days', { days: d })}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">{t(variable === 'rain_prob' ? 'accuracyHintRain' : 'accuracyHint', { unit: UNIT[variable] })}</p>
          {metrics.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noScoresYet')}</p>
          ) : (
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[#1a2540]">
                    <th className="p-3 font-normal" />
                    {[1, 6, 24].map((h) => <th key={h} className="p-3 font-normal text-right">{t('ahead', { hours: h })}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ALL_METHODS.filter((m) => metrics.some((x) => x.method === m)).map((m) => (
                    <tr key={m} className="border-b border-[#1a2540]/60 last:border-0">
                      <td className="p-3 text-slate-300 whitespace-nowrap">
                        <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: COLOR[m] }} aria-hidden="true" />
                        {t(`methods.${m}` as any)}
                      </td>
                      {[1, 6, 24].map((h) => {
                        const x = metricFor(m, h);
                        const skill = x?.skill_vs_persistence;
                        return (
                          <td key={h} className="p-3 text-right tabular-nums" title={x ? t('checks', { n: x.n }) : undefined}>
                            <span className="text-slate-200">{fmt(headline(x), variable === 'rain_prob' ? 3 : 2)}</span>
                            {skill !== null && skill !== undefined && m !== 'persistence' && (
                              <span className={`ml-2 text-xs ${skill > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {skill > 0 ? '+' : ''}{Math.round(skill * 100)}%
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3 className={`${h2} mb-1`}>{t('weightsTitle')}</h3>
          <p className="text-xs text-slate-500 mb-3">{t('weightsHint')}</p>
          {weights.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noWeightsYet')}</p>
          ) : (
            <div className={`${card} p-4 space-y-4`}>
              {[1, 6, 24].map((h) => {
                const ws = weights.filter((w) => w.horizon_h === h).sort((a, b) => b.weight - a.weight);
                return (
                  <div key={h}>
                    <div className="text-xs text-slate-500 mb-1">{t('ahead', { hours: h })}</div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-[#1a2540]">
                      {ws.map((w) => (
                        <div key={w.method} style={{ width: `${w.weight * 100}%`, background: COLOR[w.method] ?? '#94a3b8' }}
                          title={`${t(`methods.${w.method}` as any)} ${Math.round(w.weight * 100)}%`} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-slate-400">
                      {ws.filter((w) => w.weight >= 0.05).map((w) => (
                        <span key={w.method}>{t(`methods.${w.method}` as any)} {Math.round(w.weight * 100)}%</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StripRow({ label, cells }: { label: string; cells: { k: number; v: string; bg: string }[] }) {
  return (
    <tr>
      <th className="sticky left-0 z-10 bg-[#0a0f1e] text-left font-normal text-slate-500 px-3 py-2 whitespace-nowrap">{label}</th>
      {cells.map((c) => (
        <td key={c.k} className="text-center py-2 text-slate-100" style={{ background: c.bg }}>{c.v}</td>
      ))}
    </tr>
  );
}

function ChartCard({ title, card, height = 200, children }: { title: string; card: string; height?: number; children: React.ReactElement }) {
  return (
    <div className={`${card} p-4`}>
      <div className="text-xs text-slate-500 mb-2">{title}</div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label, dashed = false, muted = false, title }: { color: string; label: string; dashed?: boolean; muted?: boolean; title?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${muted ? 'text-slate-600' : 'text-slate-400'}`} title={title}>
      <span className="inline-block w-4 h-0 border-t-2" style={{ borderColor: color, borderStyle: dashed ? 'dashed' : 'solid', opacity: muted ? 0.4 : 1 }} aria-hidden="true" />
      {label}
    </span>
  );
}

type TipProps = {
  active?: boolean;
  label?: number;
  payload?: { dataKey: string; name?: string; value: number | null; color?: string; stroke?: string }[];
  fmtTime: (v: number) => string;
  unit: string;
  names?: (key: string) => string;
};

function Tip({ active, label, payload, fmtTime, unit, names }: TipProps) {
  if (!active || !payload?.length || label === undefined) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  return (
    <div className="rounded-md border border-[#1a2540] bg-[#020409]/95 px-3 py-2 text-xs shadow-lg">
      <div className="text-[10px] text-slate-500 mb-1">{fmtTime(label)}</div>
      {rows.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-slate-300">
          <span style={{ color: p.stroke ?? p.color }}>{names ? names(p.dataKey) : p.name ?? p.dataKey}</span>
          <span className="tabular-nums">{Number(p.value).toFixed(unit === '°' || unit === '%' ? 0 : 1)} {unit}</span>
        </div>
      ))}
    </div>
  );
}
