import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Newsletter() {
  const t = useTranslations('Newsletter');

  return (
    <section className="border-t border-line" aria-labelledby="connect-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid gap-8 lg:grid-cols-[1fr_2fr] items-start">
        <h2 id="connect-heading">{t('heading')}</h2>
        <div>
          <p className="text-ink-soft max-w-2xl">{t('description')}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="https://www.linkedin.com/company/d7-technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 rounded-md bg-brand text-white text-[15px] font-medium hover:bg-brand-dark transition-colors"
            >
              {t('followLinkedin')}
            </a>
            <Link href="/contact" className="text-[15px] font-medium text-brand hover:underline">
              {t('getInTouch')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
