import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import SectionLabel from '@/components/common/SectionLabel';
import StatusBadge from '@/components/common/StatusBadge';
import TechTag from '@/components/common/TechTag';
import PublicationCard from '@/components/projects/PublicationCard';
import ProjectCover from '@/components/projects/ProjectCover';
import SectionFigure from '@/components/projects/SectionFigure';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'WearableSensorsPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/wearable-sensors'),
  };
}

export default async function WearableSensorsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'WearableSensorsPage' });
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'Common' });
  const project = getProjectBySlug('wearable-sensors')!;

  return (
    <article className="min-h-screen bg-[#020409]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20 sm:pb-24">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 mb-10 font-mono">
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
            {project.tags.map((tag) => <TechTag key={tag} tag={tag} />)}
          </div>
          <div className="mt-8">
            <ProjectCover src={project.coverImage} alt={project.coverImageAlt} priority sizes="(max-width: 896px) 100vw, 896px" />
          </div>
        </header>

        <div className="h-px bg-[#1a2540] mb-12" aria-hidden="true" />

        <section className="mb-12" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('overviewTitle')}</h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('overviewText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="localization-heading">
          <h2 id="localization-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('localizationTitle')}</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-sm sm:text-base">{t('localizationText')}</p>
          <SectionFigure src="/images/projects/controlled_localization.jpg" alt={t('localizationImageAlt')} caption={t('localizationCaption')} />
        </section>

        <section className="mb-12" aria-labelledby="motion-heading">
          <h2 id="motion-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('motionTitle')}</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-sm sm:text-base">{t('motionText')}</p>
          <SectionFigure src="/images/projects/data_driven_motion.jpg" alt={t('motionImageAlt')} caption={t('motionCaption')} />
        </section>

        <section className="mb-12" aria-labelledby="field-heading">
          <h2 id="field-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('fieldTitle')}</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-sm sm:text-base">{t('fieldText')}</p>
          <SectionFigure src="/images/projects/field_experiments.jpg" alt={t('fieldImageAlt')} caption={t('fieldCaption')} />
        </section>

        {project.publications && project.publications.length > 0 && (
          <section aria-labelledby="publications-heading">
            <div className="h-px bg-[#1a2540] mb-8" aria-hidden="true" />
            <SectionLabel label={t('publicationsLabel')} className="mb-5" />
            <h2 id="publications-heading" className="sr-only">{tCommon('overview')}</h2>
            <div className="space-y-4">
              {project.publications.map((pub, i) => <PublicationCard key={i} publication={pub} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
