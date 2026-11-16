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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-28">
      <h1 id="careers-heading">{t('heroTitle')}</h1>
      <p className="mt-4 text-xl text-ink-muted max-w-2xl">{t('heroDescription')}</p>
      <Link
        href="/contact"
        className="mt-9 inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper text-[15px] font-medium hover:bg-white transition-colors"
      >
        {t('ctaButton')}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
