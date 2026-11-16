import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import TechTag from '@/components/common/TechTag';
import PublicationCard from '@/components/projects/PublicationCard';
import ProjectCover from '@/components/projects/ProjectCover';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'MultistaticPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/multistatic'),
  };
}

export default async function MultistaticPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'MultistaticPage' });
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'Common' });
  const project = getProjectBySlug('multistatic')!;

  return (
    <article>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-8">
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
            {project.tags.map((tag) => <TechTag key={tag} tag={tag} />)}
          </div>
          <div className="mt-8">
            <ProjectCover src={project.coverImage} alt={project.coverImageAlt} priority objectFit={project.coverObjectFit} sizes="(max-width: 896px) 100vw, 896px" />
          </div>
        </header>

        <div className="h-px bg-line mb-10" aria-hidden="true" />

        <section className="mb-12" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-[1.35rem] mb-3">{t('overviewTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('overviewText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="simulation-heading">
          <h2 id="simulation-heading" className="text-[1.35rem] mb-3">{t('simulationTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-6">{t('simulationText')}</p>
          <figure className="m-0">
            <div className="relative w-full aspect-video rounded-md bg-white border border-line overflow-hidden">
              <Image src="/images/projects/simulation_map.png" alt={t('simulationImageAlt')} fill className="object-contain object-center" sizes="(max-width: 896px) 100vw, 896px" />
            </div>
            <figcaption className="mt-2.5 text-sm text-ink-muted">{t('simulationCaption')}</figcaption>
          </figure>
        </section>

        <section className="mb-12" aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="text-[1.35rem] mb-3">{t('demoTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-6">{t('demoText')}</p>
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-surface">
            <iframe src={project.youtubeEmbed} title={t('demoIframeTitle')} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </section>

        {project.publications && project.publications.length > 0 && (
          <section aria-labelledby="publications-heading">
            <div className="h-px bg-line mb-10" aria-hidden="true" />
            <h2 id="publications-heading" className="text-[1.35rem] mb-3">{t('publicationsLabel')}</h2>
            <div className="space-y-4">
              {project.publications.map((pub, i) => <PublicationCard key={i} publication={pub} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
