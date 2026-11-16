import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const ITEMS = [
  { key: 'itea', href: '/projects/advisor' },
  { key: 'ytu', href: '/projects/indoor-positioning' },
  { key: 'radarconf', href: '/projects/multistatic' },
  { key: 'siu', href: '/projects/wearable-sensors' },
] as const;

/** One slim row of programmes, partners and publications under the hero. */
export default function Credentials() {
  const t = useTranslations('Credentials');

  return (
    <section className="border-b border-line" aria-label={t('label')}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-6 lg:grid-cols-[160px_1fr] items-center">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{t('label')}</p>
        <ul className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ key, href }) => (
            <li key={key}>
              <Link href={href} className="group block">
                <span className="block font-display text-lg font-semibold uppercase text-ink group-hover:text-brand-light">
                  {t(key)}
                </span>
                <span className="block text-sm text-ink-muted">{t(`${key}Note`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
