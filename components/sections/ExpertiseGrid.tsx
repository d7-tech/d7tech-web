import { useTranslations } from 'next-intl';

const KEYS = [
  'autonomousVehicles',
  'radarSonar',
  'sensorFusion',
  'sensorSystems',
  'aiMl',
  'systemIntegration',
] as const;

export default function ExpertiseGrid() {
  const t = useTranslations('ExpertiseGrid');

  return (
    <section className="border-t border-line" aria-labelledby="expertise-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 id="expertise-heading">{t('heading')}</h2>
          <p className="mt-3 text-ink-muted max-w-sm">{t('description')}</p>
        </div>
        <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {KEYS.map((key) => (
            <div key={key}>
              <dt className="font-semibold text-ink">{t(`items.${key}.title`)}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{t(`items.${key}.description`)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
