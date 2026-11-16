import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getDemoUrl } from '@/lib/demo';
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
  // null until NEXT_PUBLIC_WAREHOUSE_DEMO_URL is set on the AWS deploy
  const demoUrl = getDemoUrl('warehouse-automation');

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
          <div className="mt-8">
            <ProjectCover
              src={project.coverImage}
              alt={project.coverImageAlt}
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        </header>

        <div className="h-px bg-line mb-10" aria-hidden="true" />

        <section className="mb-12" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-[1.35rem] mb-3">{t('overviewTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('overviewText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="approach-heading">
          <h2 id="approach-heading" className="text-[1.35rem] mb-3">{t('approachTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('approachText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="environment-heading">
          <h2 id="environment-heading" className="text-[1.35rem] mb-3">{t('environmentTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('environmentText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="platform-heading">
          <h2 id="platform-heading" className="text-[1.35rem] mb-3">{t('platformTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-6">{t('platformText')}</p>
          <SectionFigure
            src="/images/projects/warehouse_simulation_ui.jpg"
            alt={t('platformFigureAlt')}
            caption={t('platformFigureCaption')}
          />
        </section>

        <section className="mb-12" aria-labelledby="workflow-heading">
          <h2 id="workflow-heading" className="text-[1.35rem] mb-3">{t('workflowTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-6">{t('workflowText')}</p>
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
          <div className="h-px bg-line mb-10" aria-hidden="true" />
          <h2 id="status-heading" className="text-[1.35rem] mb-3">{t('statusTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-6">{t('statusText')}</p>
          {demoUrl ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand text-white text-[15px] font-medium hover:bg-brand-dark transition-colors"
            >
              {t('demoCta')}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <p className="text-[15px] text-ink-muted">{t('demoNote')}</p>
          )}
        </section>
      </div>
    </article>
  );
}
