import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import TechTag from '@/components/common/TechTag';
import WeatherDashboard from '@/components/weather/WeatherDashboard';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'MicroClimatePage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/micro-climate'),
  };
}

export default async function MicroClimatePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'MicroClimatePage' });
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'Common' });
  const project = getProjectBySlug('micro-climate')!;

  return (
    <article>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-8"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {tCommon('backToProjects')}
        </Link>

        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
            <StatusBadge status={project.status} />
          </div>
          <h1 className="mb-3">{t('title')}</h1>
          <p className="text-lg text-ink-soft mb-5">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <TechTag key={tag} tag={tag} />
            ))}
          </div>
        </header>

        <div className="h-px bg-line mb-10" aria-hidden="true" />

        <section className="mb-14" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-[1.35rem] mb-3">{t('overviewTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('overviewText')}</p>
        </section>

        <WeatherDashboard />

        <div className="h-px bg-line my-14" aria-hidden="true" />

        <section className="mb-12" aria-labelledby="methods-heading">
          <h2 id="methods-heading" className="text-[1.35rem] mb-3">{t('methodsTitle')}</h2>
          <div className="space-y-4">
            <p className="text-[17px] leading-[1.75]">{t('methodsSingle')}</p>
            <p className="text-[17px] leading-[1.75]">{t('methodsHybrid')}</p>
            <p className="text-[17px] leading-[1.75]">{t('methodsOnline')}</p>
            <p className="text-[17px] leading-[1.75]">{t('methodsTraining')}</p>
          </div>
        </section>

        <section className="mb-12" aria-labelledby="station-heading">
          <h2 id="station-heading" className="text-[1.35rem] mb-3">{t('stationTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('stationText')}</p>
        </section>

        <section aria-labelledby="issues-heading">
          <h2 id="issues-heading" className="text-[1.35rem] mb-3">{t('issuesTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('issuesText')}</p>
        </section>
      </div>
    </article>
  );
}
