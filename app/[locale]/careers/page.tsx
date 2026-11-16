import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'CareersPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'website' },
    alternates: getAlternates('/careers'),
  };
}

export default async function CareersPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'CareersPage' });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20">
      <h1 id="careers-heading">{t('heroTitle')}</h1>
      <p className="mt-4 text-lg text-ink-soft">{t('heroDescription')}</p>

      <section className="mt-12 border-t border-line pt-10">
        <p className="text-sm text-ink-muted">{t('noPositions')}</p>
        <h2 className="mt-2">{t('rolesTitle')}</h2>
        <p className="mt-3">{t('rolesDescription')}</p>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2>{t('ctaTitle')}</h2>
        <p className="mt-3">{t('ctaDescription')}</p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand text-white text-[15px] font-medium hover:bg-brand-dark transition-colors"
        >
          {t('ctaButton')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
