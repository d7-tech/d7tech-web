import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import TechTag from '@/components/common/TechTag';
import ProjectCover from '@/components/projects/ProjectCover';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'UnderwaterGlidersPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/underwater-gliders'),
  };
}

export default async function UnderwaterGlidersPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'UnderwaterGlidersPage' });
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'Common' });
  const project = getProjectBySlug('underwater-gliders')!;

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
            <ProjectCover src={project.coverImage} alt={project.coverImageAlt} priority sizes="(max-width: 896px) 100vw, 896px" />
          </div>
        </header>

        <div className="h-px bg-line mb-10" aria-hidden="true" />

        <section className="rounded-md bg-surface p-6 sm:p-8">
          <h2 className="text-[1.35rem] mb-3">{t('researchTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('description')}</p>
          <p className="mt-4 text-[15px] text-ink-muted">{t('updatesComingSoon')}</p>
        </section>
      </div>
    </article>
  );
}
