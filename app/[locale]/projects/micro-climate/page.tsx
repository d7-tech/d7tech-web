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
  const methods = ['single', 'hybrid', 'online'] as const;

  return (
    <article className="min-h-screen bg-[#020409]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20 sm:pb-24">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 mb-10 font-mono"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {tCommon('backToProjects')}
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="font-mono text-[11px] tracking-widest text-sky-500/50 uppercase">{t('prjId')}</span>
            <StatusBadge status={project.status} />
          </div>
          <SectionLabel label={t('sectionLabel')} className="mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">{t('title')}</h1>
          <p className="text-base text-slate-400 leading-relaxed mb-4 max-w-3xl">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <TechTag key={tag} tag={tag} />
            ))}
          </div>
        </header>

        <WeatherDashboard />

        <section className="mt-14" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-lg font-semibold text-slate-100 mb-4">{t('howTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {methods.map((m) => (
              <div key={m} className="rounded-lg border border-[#1a2540] bg-[#0a0f1e]/70 p-4">
                <h3 className="text-slate-100 font-semibold mb-1">{t(`methods.${m}.title`)}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t(`methods.${m}.text`)}</p>
              </div>
            ))}
          </div>
          <details className="mt-4 group rounded-lg border border-[#1a2540] bg-[#0a0f1e]/40 p-4">
            <summary className="cursor-pointer text-sm text-slate-300 select-none">{t('moreTitle')}</summary>
            <div className="mt-3 space-y-3 text-sm text-slate-400 leading-relaxed max-w-3xl">
              <p>{t('moreScoring')}</p>
              <p>{t('moreSystem')}</p>
              <p>{t('moreModels')}</p>
            </div>
          </details>
        </section>
      </div>
    </article>
  );
}
