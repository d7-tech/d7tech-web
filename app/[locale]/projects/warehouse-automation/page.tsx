import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import SectionLabel from '@/components/common/SectionLabel';
import StatusBadge from '@/components/common/StatusBadge';
import TechTag from '@/components/common/TechTag';
import ProjectCover from '@/components/projects/ProjectCover';
import SectionFigure from '@/components/projects/SectionFigure';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'WarehouseAutomationPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/warehouse-automation'),
  };
}

export default async function WarehouseAutomationPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'WarehouseAutomationPage' });
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'Common' });
  const project = getProjectBySlug('warehouse-automation')!;

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
          <div className="mt-8">
            <ProjectCover
              src={project.coverImage}
              alt={project.coverImageAlt}
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        </header>

        <div className="h-px bg-[#1a2540] mb-12" aria-hidden="true" />

        <section className="mb-12" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('overviewTitle')}</h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('overviewText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="approach-heading">
          <h2 id="approach-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('approachTitle')}</h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('approachText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="environment-heading">
          <h2 id="environment-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('environmentTitle')}</h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{t('environmentText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="platform-heading">
          <h2 id="platform-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('platformTitle')}</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-sm sm:text-base">{t('platformText')}</p>
          <SectionFigure
            src="/images/projects/warehouse_simulation_ui.jpg"
            alt={t('platformFigureAlt')}
            caption={t('platformFigureCaption')}
          />
        </section>

        <section className="mb-12" aria-labelledby="workflow-heading">
          <h2 id="workflow-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('workflowTitle')}</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-sm sm:text-base">{t('workflowText')}</p>
          <div className="space-y-8">
            <SectionFigure
              src="/images/projects/warehouse_firma_panel.jpg"
              alt={t('workflowFigureAlt')}
              caption={t('workflowFigureCaption')}
            />
            <SectionFigure
              src="/images/projects/warehouse_product_catalog.jpg"
              alt={t('catalogFigureAlt')}
              caption={t('catalogFigureCaption')}
            />
          </div>
        </section>

        <section aria-labelledby="status-heading">
          <div className="h-px bg-[#1a2540] mb-8" aria-hidden="true" />
          <h2 id="status-heading" className="text-xl font-semibold text-slate-100 mb-4">{t('statusTitle')}</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-sm sm:text-base">{t('statusText')}</p>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-dot" aria-hidden="true" />
            {t('demoNote')}
          </div>
        </section>
      </div>
    </article>
  );
}
