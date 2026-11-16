import { useTranslations } from 'next-intl';
import Reveal from '@/components/motion/Reveal';

const KEYS = ['autonomousVehicles', 'radarSonar', 'sensorFusion', 'sensorSystems', 'aiMl', 'systemIntegration'] as const;

export default function ExpertiseGrid() {
  const t = useTranslations('ExpertiseGrid');

  return (
    <section className="border-t border-line" aria-labelledby="expertise-heading">
      <div className="wrap py-20 sm:py-28 grid gap-12 lg:grid-cols-[1fr_2fr]">
        <Reveal>
          <p className="label">{t('label')}</p>
          <h2 id="expertise-heading" className="mt-4 max-w-sm">{t('heading')}</h2>
        </Reveal>
        <ul className="grid sm:grid-cols-2 border-t border-line">
          {KEYS.map((key, i) => (
            <Reveal as="li" key={key} delay={(i % 2) * 0.08} className="border-b border-line py-6 sm:pr-10">
              <h3>{t(`items.${key}.title`)}</h3>
              <p className="mt-1.5 text-ink-muted">{t(`items.${key}.description`)}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
