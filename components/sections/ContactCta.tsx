import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export default function ContactCta() {
  const t = useTranslations('ContactCta');

  return (
    <section className="bg-surface border-t border-line" aria-labelledby="cta-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <h2 id="cta-heading" className="max-w-2xl">{t('heading')}</h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper text-[15px] font-medium hover:bg-white transition-colors"
          >
            {t('button')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a
            href="https://www.linkedin.com/company/d7-technology/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] font-medium text-brand-light hover:text-ink"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
