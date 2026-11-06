import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import SectionLabel from '@/components/common/SectionLabel';
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
    <article className="min-h-screen bg-[#020409]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20 sm:pb-24">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 mb-10 font-mono"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {tCommon('backToProjects')}
        </Link>

        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="font-mono text-[11px] tracking-widest text-sky-500/50 uppercase">{t('prjId')}</span>
            <StatusBadge status={project.status} />
          </div>
          <SectionLabel label={t('sectionLabel')} className="mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">{t('title')}</h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-6">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <TechTag key={tag} tag={tag} />
            ))}
          </div>
        </header>

        <div className="h-px bg-[#1a2540] mb-12" aria-hidden="true" />

        <section className="mb-14" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('overviewTitle')}</h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('overviewText')}</p>
        </section>

        <WeatherDashboard />

        <div className="h-px bg-[#1a2540] my-14" aria-hidden="true" />

        <section className="mb-12" aria-labelledby="methods-heading">
          <h2 id="methods-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('methodsTitle')}</h2>
          <div className="space-y-4">
            <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('methodsSingle')}</p>
            <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('methodsHybrid')}</p>
            <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('methodsOnline')}</p>
            <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('methodsTraining')}</p>
          </div>
        </section>

        <section className="mb-12" aria-labelledby="station-heading">
          <h2 id="station-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('stationTitle')}</h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('stationText')}</p>
        </section>

        <section aria-labelledby="issues-heading">
          <h2 id="issues-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('issuesTitle')}</h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('issuesText')}</p>
        </section>
      </div>
    </article>
  );
}
