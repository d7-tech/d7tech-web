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
    <section aria-labelledby="expertise-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <h2 id="expertise-heading" className="max-w-xl">{t('heading')}</h2>
        <ul className="mt-12 grid gap-px bg-line border-y border-line sm:grid-cols-2 lg:grid-cols-3">
          {KEYS.map((key) => (
            <li key={key} className="bg-paper py-7 sm:pr-8">
              <h3 className="text-lg">{t(`items.${key}.title`)}</h3>
              <p className="mt-1.5 text-ink-muted">{t(`items.${key}.description`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
