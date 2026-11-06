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
 */
const API = process.env.NEXT_PUBLIC_WEATHER_API ?? 'https://api.d7tech.net/api/v1';
const STATION = 1;
const TZ = 'Europe/Istanbul';
const HOUR = 3600_000;
const REFRESH_MS = 60_000;

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
  lightning_total: number | null;
  lightning_km: number | null;
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
type Metric = {
  method: string;
  horizon_h: number;
  n: number;
  mae: number | null;
  brier: number | null;
  skill_vs_persistence: number | null;
};
type Weight = { horizon_h: number; method: string; weight: number };
type ModelStatus = { method: string; trained_at: string; ready: boolean; note: string | null };

type Variable = 'wind_ms' | 'gust_ms' | 'rain_mm' | 'rain_prob' | 'wind_dir_deg';
const VARIABLES: Variable[] = ['wind_ms', 'gust_ms', 'rain_mm', 'rain_prob', 'wind_dir_deg'];
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
/** SARIMA models only forecast amounts (wind, gust, rain); rain chance and direction come from the other methods. */
const SARIMA_VARS: Variable[] = ['wind_ms', 'gust_ms', 'rain_mm'];

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

function compass(deg: number | null) {
  if (deg === null || deg === undefined) return '–';
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return names[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
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

/** Beaufort-style description of a wind speed (m/s). */
function windWord(ms: number | null | undefined) {
  if (ms === null || ms === undefined) return null;
  const steps: [number, string][] = [[0.5, 'calm'], [1.6, 'lightAir'], [3.4, 'lightBreeze'], [5.5, 'gentleBreeze'],
    [8, 'moderateBreeze'], [10.8, 'freshBreeze'], [13.9, 'strongBreeze'], [Infinity, 'gale']];
  return steps.find(([lim]) => ms < lim)![1];
}

/** Which forecast the summary uses: the first of these that has a forecast. */
const OUTLOOK_ORDER = ['online', 'hybrid-lgbm', 'single-lgbm', 'nwp'];
const OUTLOOK_VARS = ['wind_ms', 'gust_ms', 'rain_prob', 'rain_mm'] as const;
type OutlookVar = (typeof OUTLOOK_VARS)[number];

function valueAt(ps: Pred[] | undefined, method: string, h: number) {
  const mine = (ps ?? []).filter((p) => p.method === method);
  if (!mine.length) return null;
  const target = Date.parse(mine[0].issued_at) + h * HOUR;
  return mine.find((p) => Date.parse(p.valid_at) === target)?.value ?? null;
}

const axisNum = (v: number) => Number(v.toFixed(Math.abs(v) >= 100 ? 0 : Math.abs(v) < 1 ? 2 : 1)).toString();

export default function WeatherDashboard() {
  const t = useTranslations('MicroClimatePage.dashboard');
  const locale = useLocale();
  const [latest, setLatest] = useState<Latest | null | undefined>(undefined);
  const [bins, setBins] = useState<Bin[]>([]);
  const [range, setRange] = useState<24 | 168 | 720>(24);
  const [variable, setVariable] = useState<Variable>('wind_ms');
  const [group, setGroup] = useState<Group>('single');
  const [preds, setPreds] = useState<Pred[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [windowDays, setWindowDays] = useState<7 | 30>(7);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [outlook, setOutlook] = useState<Partial<Record<OutlookVar, Pred[]>>>({});

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }),
    [locale],
  );
  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', hour12: false }),
    [locale],
  );

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

  const loadForecast = useCallback(async () => {
    const [p, w] = await Promise.all([
      getJson<Pred[]>(`/forecast?station=${STATION}&variable=${variable}`),
      getJson<Weight[]>(`/online_weights?station=${STATION}&variable=${variable}`),
    ]);
    setPreds(p ?? []);
    setWeights(w ?? []);
  }, [variable]);

  const loadOutlook = useCallback(async () => {
    const res = await Promise.all(OUTLOOK_VARS.map((v) => getJson<Pred[]>(`/forecast?station=${STATION}&variable=${v}`)));
    setOutlook(Object.fromEntries(OUTLOOK_VARS.map((v, i) => [v, res[i] ?? []])));
  }, []);

  const loadMetrics = useCallback(async () => {
    setMetrics((await getJson<Metric[]>(`/metrics?station=${STATION}&variable=${variable}&window_days=${windowDays}`)) ?? []);
  }, [variable, windowDays]);

  useEffect(() => {
    loadLive();
    const id = setInterval(loadLive, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadLive]);
  useEffect(() => {
    loadForecast();
    const id = setInterval(loadForecast, REFRESH_MS * 5);
    return () => clearInterval(id);
  }, [loadForecast]);
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);
  useEffect(() => {
    loadOutlook();
    const id = setInterval(loadOutlook, REFRESH_MS * 5);
    return () => clearInterval(id);
  }, [loadOutlook]);

  const outlookMethod = OUTLOOK_ORDER.find((m) => (outlook.wind_ms ?? []).some((p) => p.method === m));

  // ---- history charts: one point per 10-minute bin, nulls where a bin is missing (drawn as gaps) ----
  const history = useMemo(() => {
    const end = Math.floor(now / 600_000) * 600_000;
    const start = end - range * HOUR;
    const byTime = new Map(bins.map((b) => [Date.parse(b.bin_start), b]));
    const step = range > 168 ? 3600_000 : 600_000; // 30 days: hourly points keep the chart light
    const rows: { t: number; wind: number | null; gust: number | null; temp: number | null; rain: number | null; press: number | null }[] = [];
    for (let s = Math.ceil(start / step) * step; s <= end; s += step) {
      const group = step === 600_000 ? [byTime.get(s)].filter(Boolean) as Bin[] :
        Array.from({ length: 6 }, (_, i) => byTime.get(s + i * 600_000)).filter(Boolean) as Bin[];
      const avg = (k: keyof Bin) => {
        const v = group.map((b) => b[k] as number | null).filter((x): x is number => x !== null);
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      };
      const gusts = group.map((b) => b.gust_ms).filter((x): x is number => x !== null);
      const rains = group.map((b) => b.rain_mm).filter((x): x is number => x !== null);
      rows.push({
        t: s,
        wind: avg('wind_ms'),
        gust: gusts.length ? Math.max(...gusts) : null,
        temp: avg('temp_c'),
        press: avg('press_hpa'),
        rain: rains.length ? rains.reduce((a, b) => a + b, 0) : null,
      });
    }
    return rows;
  }, [bins, range, now]);

  const expected = range * 6;
  const completeness = Math.min(100, Math.round((bins.filter((b) => Date.parse(b.bin_start) >= now - range * HOUR).length / expected) * 100));
  const rainToday = useMemo(() => {
    // local midnight in Istanbul (UTC+3 all year, no daylight saving since 2016)
    const day = 24 * HOUR;
    const start = Math.floor((now + 3 * HOUR) / day) * day - 3 * HOUR;
    return bins.filter((b) => Date.parse(b.bin_start) >= start).reduce((a, b) => a + (b.rain_mm ?? 0), 0);
  }, [bins, now]);

  // ---- forecast chart: observed past 24 h + each method's latest forecast for the next 24 h ----
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
    return Array.from(rows.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([tt, r]) => ({ t: tt, ...r }));
  }, [obsHourly, preds, variable, scale, now]);

  const issued = preds.find((p) => GROUPS[group].includes(p.method))?.issued_at ?? preds[0]?.issued_at;
  const methodsWithData = new Set(preds.map((p) => p.method));
  const modelNote = (m: string) => models.find((x) => x.method === m);

  const horizonValue = (method: string, h: number) => {
    const ps = preds.filter((p) => p.method === method);
    if (!ps.length) return null;
    const target = Date.parse(ps[0].issued_at) + h * HOUR;
    const p = ps.find((x) => Date.parse(x.valid_at) === target);
    return p ? p.value * scale : null;
  };

  const metricFor = (method: string, h: number) => metrics.find((m) => m.method === method && m.horizon_h === h);
  const headline = (m?: Metric) => (variable === 'rain_prob' ? m?.brier : m?.mae);

  const ago = latest ? Math.round((now - Date.parse(latest.measured_at)) / 60_000) : null;
  const live = ago !== null && ago <= 15;
  const tick = (v: number) => (range > 24 ? dayFmt.format(v) : timeFmt.format(v));

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-sm border font-mono text-[11px] tracking-wider uppercase transition-colors ${
      active ? 'border-sky-400/60 bg-sky-400/10 text-sky-300' : 'border-[#1a2540] text-slate-500 hover:text-slate-300'
    }`;
  const card = 'rounded-sm border border-[#1a2540] bg-[#0a0f1e]/60';

  return (
    <div className="space-y-12">
      {/* ---------- live conditions ---------- */}
      <section aria-labelledby="live-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 id="live-heading" className="text-xl font-semibold text-slate-100">{t('liveTitle')}</h2>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-400 pulse-dot' : 'bg-amber-400'}`} aria-hidden="true" />
            {latest === undefined
              ? t('loading')
              : latest === null
                ? t('noData')
                : live
                  ? t('liveSince', { minutes: ago ?? 0 })
                  : t('lastSeen', { time: dayFmt.format(Date.parse(latest.measured_at)) })}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: 'temp', v: `${fmt(latest?.temp_c)} °C` },
            { k: 'humidity', v: `${fmt(latest?.rh_pct, 0)} %` },
            { k: 'pressure', v: `${fmt(latest?.press_hpa, 0)} hPa` },
            { k: 'wind', v: `${fmt(latest?.wind_ms)} m/s`, sub: windWord(latest?.wind_ms) ? t(`wind.${windWord(latest?.wind_ms)}` as any) : undefined },
            { k: 'gust', v: `${fmt(latest?.gust_ms)} m/s` },
            { k: 'direction', v: latest?.wind_dir_deg != null ? `${compass(latest.wind_dir_deg)} · ${fmt(latest.wind_dir_deg, 0)}°` : '–' },
            { k: 'rainToday', v: `${fmt(rainToday)} mm` },
            { k: 'soil', v: `${fmt(latest?.soil_pct, 0)} %` },
          ].map(({ k, v, sub }: { k: string; v: string; sub?: string }) => (
            <div key={k} className={`${card} p-4`}>
              <div className="font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-1">{t(`tiles.${k}` as any)}</div>
              <div className="text-lg sm:text-xl font-semibold text-slate-100 tabular-nums">{v}</div>
              {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- the next hours, in words ---------- */}
      <section aria-labelledby="outlook-heading">
        <h2 id="outlook-heading" className="text-xl font-semibold text-slate-100 mb-2">{t('outlookTitle')}</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          {outlookMethod ? t('outlookIntro', { method: t(`methods.${outlookMethod}` as any) }) : t('noForecastYet')}
        </p>
        {outlookMethod && (
          <div className="grid sm:grid-cols-3 gap-3">
            {[1, 6, 24].map((h) => {
              const wind = valueAt(outlook.wind_ms, outlookMethod, h);
              const gust = valueAt(outlook.gust_ms, outlookMethod, h);
              const prob = valueAt(outlook.rain_prob, outlookMethod, h) ?? valueAt(outlook.rain_prob, 'nwp', h);
              const mm = valueAt(outlook.rain_mm, outlookMethod, h);
              const issuedAt = (outlook.wind_ms ?? []).find((p) => p.method === outlookMethod)?.issued_at;
              const at = issuedAt ? Date.parse(issuedAt) + h * HOUR : null;
              const word = windWord(wind);
              const pct = prob === null ? null : Math.round(prob * 100);
              const rainKey = pct === null ? null : pct < 20 ? 'dry' : pct < 50 ? 'possible' : 'likely';
              return (
                <div key={h} className={`${card} p-4`}>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-2">
                    {t('outlookIn', { hours: h })}{at ? ` · ${timeFmt.format(at)}` : ''}
                  </div>
                  <div className="text-lg font-semibold text-slate-100 mb-1">{word ? t(`wind.${word}` as any) : '–'}</div>
                  <div className="text-sm text-slate-300 tabular-nums">
                    {t('outlookWind', { wind: fmt(wind), kmh: fmt(wind === null ? null : wind * 3.6, 0) })}
                    {gust !== null && <> · {t('outlookGust', { gust: fmt(gust) })}</>}
                  </div>
                  {rainKey && (
                    <div className="text-sm text-slate-300 mt-2 tabular-nums">
                      <span className={rainKey === 'dry' ? 'text-slate-300' : 'text-sky-300'}>{t(`rain.${rainKey}` as any)}</span>
                      {' · '}{t('outlookRainChance', { pct: pct ?? 0 })}
                      {mm !== null && mm >= 0.05 && <> · {t('outlookRainMm', { mm: fmt(mm) })}</>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- history ---------- */}
      <section aria-labelledby="history-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 id="history-heading" className="text-xl font-semibold text-slate-100">{t('historyTitle')}</h2>
          <div className="flex gap-2" role="group" aria-label={t('historyTitle')}>
            {([24, 168, 720] as const).map((r) => (
              <button key={r} className={btn(range === r)} onClick={() => setRange(r)} aria-pressed={range === r}>
                {t(`range.${r}` as any)}
              </button>
            ))}
          </div>
        </div>
        <p className="font-mono text-[11px] text-slate-500 mb-4">{t('completeness', { percent: completeness })}</p>
        <div className="grid gap-4">
          <ChartCard title={t('charts.wind')} card={card}>
            <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#1a2540" vertical={false} />
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={tick} stroke="#475569" fontSize={11} minTickGap={40} />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} unit="" />
              <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit="m/s" />} />
              <Line dataKey="gust" name={t('series.gust')} stroke="#38bdf8" strokeOpacity={0.45} dot={loneDot(history, 'gust', '#38bdf880')} isAnimationActive={false} connectNulls={false} />
              <Line dataKey="wind" name={t('series.wind')} stroke="#38bdf8" strokeWidth={2} dot={loneDot(history, 'wind', '#38bdf8')} isAnimationActive={false} connectNulls={false} />
            </LineChart>
          </ChartCard>
          <div className="grid sm:grid-cols-2 gap-4">
            <ChartCard title={t('charts.temp')} card={card} height={180}>
              <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#1a2540" vertical={false} />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={tick} stroke="#475569" fontSize={11} minTickGap={40} />
                <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} domain={['auto', 'auto']} />
                <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit="°C" />} />
                <Line dataKey="temp" name={t('series.temp')} stroke="#fb923c" strokeWidth={2} dot={loneDot(history, 'temp', '#fb923c')} isAnimationActive={false} connectNulls={false} />
              </LineChart>
            </ChartCard>
            <ChartCard title={t('charts.rain')} card={card} height={180}>
              <BarChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#1a2540" vertical={false} />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={tick} stroke="#475569" fontSize={11} minTickGap={40} />
                <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} allowDecimals />
                <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit="mm" />} />
                <Bar dataKey="rain" name={t('series.rain')} fill="#38bdf8" isAnimationActive={false} />
              </BarChart>
            </ChartCard>
          </div>
        </div>
      </section>

      {/* ---------- forecasts ---------- */}
      <section aria-labelledby="forecast-heading">
        <h2 id="forecast-heading" className="text-xl font-semibold text-slate-100 mb-2">{t('forecastTitle')}</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">{t('forecastIntro')}</p>
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={t('variableLabel')}>
          {VARIABLES.map((v) => (
            <button key={v} className={btn(variable === v)} onClick={() => setVariable(v)} aria-pressed={variable === v}>
              {t(`variables.${v}` as any)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label={t('groupLabel')}>
          {(Object.keys(GROUPS) as Group[]).map((g) => (
            <button key={g} role="tab" aria-selected={group === g} className={btn(group === g)} onClick={() => setGroup(g)}>
              {t(`groups.${g}` as any)}
            </button>
          ))}
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{t(`groupInfo.${group}` as any)}</p>

        <div className={`${card} p-4`}>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 font-mono text-[11px]">
            <Legend color={COLOR.observed} label={t('series.observed')} />
            {shown.map((m) => (
              <Legend key={m} color={COLOR[m]} label={t(`methods.${m}` as any)} dashed={BASELINES.includes(m)} muted={!methodsWithData.has(m)} />
            ))}
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastRows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#1a2540" vertical={false} />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={(v) => timeFmt.format(v)} stroke="#475569" fontSize={11} minTickGap={40} />
                <YAxis stroke="#475569" fontSize={11} tickFormatter={axisNum} domain={variable === 'wind_dir_deg' ? [0, 360] : variable === 'rain_prob' ? [0, 100] : [0, 'auto']} />
                <Tooltip content={<Tip fmtTime={(v) => dayFmt.format(v)} unit={UNIT[variable]} names={(k) => (k === 'observed' ? t('series.observed') : t(`methods.${k}` as any))} />} />
                <ReferenceLine x={now} stroke="#334155" strokeDasharray="3 3" label={{ value: t('now'), fill: '#64748b', fontSize: 10, position: 'insideTopRight' }} />
                <Line dataKey="observed" stroke={COLOR.observed} strokeWidth={2} dot={loneDot(forecastRows, 'observed', COLOR.observed)} isAnimationActive={false} connectNulls={false} />
                {shown.map((m) => (
                  <Line
                    key={m}
                    dataKey={m}
                    stroke={COLOR[m]}
                    strokeWidth={BASELINES.includes(m) ? 1.5 : 2}
                    strokeDasharray={BASELINES.includes(m) ? '5 4' : undefined}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="font-mono text-[11px] text-slate-500 mt-2">
            {issued ? t('issuedAt', { time: dayFmt.format(Date.parse(issued)) }) : t('noForecastYet')}
          </p>
        </div>

        {/* status of the two variants in this group */}
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {GROUPS[group].map((m) => {
            const status = modelNote(m);
            const sarimaGap = m.includes('sarima') && !SARIMA_VARS.includes(variable);
            let note: string;
            if (sarimaGap) note = t('notForVariable');
            else if (methodsWithData.has(m)) note = t('ready');
            else if (m === 'online-river') note = t('warmingUp');
            else if (m === 'online') note = t('blendWaiting');
            else if (status && !status.ready) note = /not enough data/.test(status.note ?? '') ? t('needsWeek') : t('training', { note: status.note ?? '' });
            else if (status?.ready) note = t('nextHour');
            else note = t('noForecastYet');
            return (
              <div key={m} className={`${card} p-3 flex items-start gap-3`}>
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: COLOR[m] }} aria-hidden="true" />
                <div>
                  <div className="text-sm text-slate-200 font-medium">{t(`methods.${m}` as any)}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{t(`methodInfo.${m}` as any)}</div>
                  <div className="font-mono text-[11px] text-sky-400/70 mt-1">{note}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* values at 1 / 6 / 24 h */}
        <div className={`${card} mt-3 overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[10px] tracking-widest uppercase text-slate-500 border-b border-[#1a2540]">
                <th className="p-3 font-normal">{t('table.method')}</th>
                {[1, 6, 24].map((h) => (
                  <th key={h} className="p-3 font-normal text-right">{t('table.in', { hours: h })}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m} className="border-b border-[#1a2540]/60 last:border-0">
                  <td className="p-3 text-slate-300">
                    <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: COLOR[m] }} aria-hidden="true" />
                    {t(`methods.${m}` as any)}
                  </td>
                  {[1, 6, 24].map((h) => (
                    <td key={h} className="p-3 text-right tabular-nums text-slate-200">
                      {fmt(horizonValue(m, h), variable === 'wind_dir_deg' || variable === 'rain_prob' ? 0 : 1)}
                      <span className="text-slate-500 text-xs ml-1">{UNIT[variable]}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- accuracy ---------- */}
      <section aria-labelledby="accuracy-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h2 id="accuracy-heading" className="text-xl font-semibold text-slate-100">{t('accuracyTitle')}</h2>
          <div className="flex gap-2" role="group">
            {([7, 30] as const).map((d) => (
              <button key={d} className={btn(windowDays === d)} onClick={() => setWindowDays(d)} aria-pressed={windowDays === d}>
                {t('days', { days: d })}
              </button>
            ))}
          </div>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          {t(variable === 'rain_prob' ? 'accuracyIntroRain' : 'accuracyIntro', { variable: t(`variables.${variable}` as any), unit: UNIT[variable] })}
        </p>
        {metrics.length === 0 ? (
          <p className="font-mono text-[11px] text-slate-500">{t('noScoresYet')}</p>
        ) : (
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-mono text-[10px] tracking-widest uppercase text-slate-500 border-b border-[#1a2540]">
                  <th className="p-3 font-normal">{t('table.method')}</th>
                  {[1, 6, 24].map((h) => (
                    <th key={h} className="p-3 font-normal text-right">{t('table.at', { hours: h })}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_METHODS.filter((m) => metrics.some((x) => x.method === m)).map((m) => (
                  <tr key={m} className="border-b border-[#1a2540]/60 last:border-0">
                    <td className="p-3 text-slate-300">
                      <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: COLOR[m] }} aria-hidden="true" />
                      {t(`methods.${m}` as any)}
                    </td>
                    {[1, 6, 24].map((h) => {
                      const x = metricFor(m, h);
                      const skill = x?.skill_vs_persistence;
                      return (
                        <td key={h} className="p-3 text-right tabular-nums">
                          <div className="text-slate-200">{fmt(headline(x), variable === 'rain_prob' ? 3 : 2)}</div>
                          {skill !== null && skill !== undefined && m !== 'persistence' && (
                            <div className={`text-[11px] font-mono ${skill > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {skill > 0 ? '+' : ''}
                              {Math.round(skill * 100)}%
                            </div>
                          )}
                          {x && <div className="text-[10px] text-slate-600">{t('checks', { n: x.n })}</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- online blend weights ---------- */}
      <section aria-labelledby="weights-heading">
        <h2 id="weights-heading" className="text-xl font-semibold text-slate-100 mb-2">{t('weightsTitle')}</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{t('weightsIntro')}</p>
        {weights.length === 0 ? (
          <p className="font-mono text-[11px] text-slate-500">{t('noWeightsYet')}</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {[1, 6, 24].map((h) => (
              <div key={h} className={`${card} p-4`}>
                <div className="font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-3">{t('table.at', { hours: h })}</div>
                <div className="space-y-2">
                  {weights
                    .filter((w) => w.horizon_h === h)
                    .sort((a, b) => b.weight - a.weight)
                    .map((w) => (
                      <div key={w.method}>
                        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                          <span>{t(`methods.${w.method}` as any)}</span>
                          <span className="tabular-nums">{Math.round(w.weight * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-[#1a2540] rounded-sm overflow-hidden">
                          <div className="h-full" style={{ width: `${w.weight * 100}%`, background: COLOR[w.method] ?? '#94a3b8' }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ChartCard({ title, card, height = 220, children }: { title: string; card: string; height?: number; children: React.ReactElement }) {
  return (
    <div className={`${card} p-4`}>
      <div className="font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-2">{title}</div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label, dashed = false, muted = false }: { color: string; label: string; dashed?: boolean; muted?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${muted ? 'text-slate-600' : 'text-slate-400'}`}>
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
    <div className="rounded-sm border border-[#1a2540] bg-[#020409]/95 px-3 py-2 text-xs shadow-lg">
      <div className="font-mono text-[10px] text-slate-500 mb-1">{fmtTime(label)}</div>
      {rows.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-slate-300">
          <span style={{ color: p.stroke ?? p.color }}>{names ? names(p.dataKey) : p.name ?? p.dataKey}</span>
          <span className="tabular-nums">
            {Number(p.value).toFixed(unit === '°' || unit === '%' ? 0 : 1)} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
