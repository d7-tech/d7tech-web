import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const ITEMS = [
  { key: 'itea', href: '/projects/advisor' },
  { key: 'radarconf', href: '/projects/multistatic' },
  { key: 'siu', href: '/projects/wearable-sensors' },
] as const;

/** One slim row of programmes and publications under the hero. */
export default function Credentials() {
  const t = useTranslations('Credentials');

  return (
    <section className="border-b border-line" aria-label={t('label')}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-6 sm:grid-cols-[180px_1fr] items-center">
        <p className="text-sm text-ink-muted">{t('label')}</p>
        <ul className="grid gap-6 sm:grid-cols-3">
          {ITEMS.map(({ key, href }) => (
            <li key={key}>
              <Link href={href} className="group block">
                <span className="block font-semibold text-ink group-hover:text-brand">{t(`${key}`)}</span>
                <span className="block text-sm text-ink-muted">{t(`${key}Note`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
