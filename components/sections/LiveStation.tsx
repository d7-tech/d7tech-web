'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_WEATHER_API ?? 'https://api.d7tech.net/api/v1';

type Latest = {
  measured_at: string;
  temp_c: number | null;
  rh_pct: number | null;
  press_hpa: number | null;
  wind_ms: number | null;
};

/** Live readings from our weather station. Renders nothing if the API is unreachable. */
export default function LiveStation() {
  const t = useTranslations('Live');
  const locale = useLocale();
  const [data, setData] = useState<Latest | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${API}/latest`, { cache: 'no-store' });
        if (!r.ok) return;
        const j = (await r.json()) as Latest;
        if (alive && j?.measured_at) setData(j);
      } catch {
        /* offline: keep whatever we had */
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!data) return null;

  const at = new Date(data.measured_at);
  const ageMin = (Date.now() - at.getTime()) / 60_000;
  // A station that has been silent for two days would only make the site look abandoned.
  if (ageMin > 48 * 60) return null;
  const fresh = ageMin < 30;
  const sameDay = ageMin < 12 * 60;
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(sameDay ? {} : { day: 'numeric', month: 'short' }),
  }).format(at);

  const n = (v: number | null, d = 1) => (v === null || v === undefined ? '–' : v.toFixed(d));
  const readings = [
    { k: 'temp', v: n(data.temp_c), u: '°C' },
    { k: 'wind', v: n(data.wind_ms), u: 'm/s' },
    { k: 'humidity', v: n(data.rh_pct, 0), u: '%' },
    { k: 'pressure', v: n(data.press_hpa, 0), u: 'hPa' },
  ] as const;

  return (
    <div className="border-t border-white/15 bg-paper/70 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          <span className={`w-1.5 h-1.5 rounded-full ${fresh ? 'bg-emerald-400' : 'bg-ink-muted'}`} aria-hidden="true" />
          {t('label')}
        </p>
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          {readings.map((r) => (
            <div key={r.k} className="flex items-baseline gap-2">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{t(r.k)}</dt>
              <dd className="font-mono text-sm text-ink tabular-nums">
                {r.v} <span className="text-ink-muted">{r.u}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          {fresh ? t('updated', { time }) : t('stale', { time })}
        </p>
        <Link
          href="/projects/micro-climate"
          className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-brand-light hover:text-ink"
        >
          {t('more')}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
