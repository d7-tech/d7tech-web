import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';

export default function ContactCta() {
  const t = useTranslations('ContactCta');

  return (
    <section className="py-20 sm:py-28" aria-labelledby="cta-heading">
      <Reveal className="wrap flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <h2 id="cta-heading" className="max-w-3xl">{t('heading')}</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/contact" className="btn btn-primary">
            {t('button')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <a href="https://www.linkedin.com/company/d7-technology/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            LinkedIn
          </a>
        </div>
      </Reveal>
    </section>
  );
}
