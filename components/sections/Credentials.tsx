import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const ITEMS = [
  { key: 'itea', href: '/projects/advisor' },
  { key: 'ytu', href: '/projects/indoor-positioning' },
  { key: 'radarconf', href: '/projects/multistatic' },
  { key: 'siu', href: '/projects/wearable-sensors' },
] as const;

/** Programmes, partners and publications, in hairline cells. */
export default function Credentials() {
  const t = useTranslations('Credentials');

  return (
    <section className="border-b border-line" aria-label={t('label')}>
      <div className="wrap grid lg:grid-cols-[220px_1fr]">
        <p className="label py-6 lg:border-r border-line">{t('label')}</p>
        <ul className="grid grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ key, href }, i) => (
            <li key={key} className={`py-6 lg:px-6 ${i > 0 ? 'lg:border-l border-line' : ''}`}>
              <Link href={href} className="group block">
                <span className="block text-lg tracking-tight text-ink group-hover:text-signal">{t(key)}</span>
                <span className="block text-sm text-ink-muted">{t(`${key}Note`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
