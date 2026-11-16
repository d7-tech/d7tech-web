import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import PublicationCard from '@/components/projects/PublicationCard';
import type { Project } from '@/lib/data/projects';

/** Case-study page: title, wide cover, a facts column and the sections. */
export default async function ProjectLayout({
  project,
  locale,
  title,
  subtitle,
  lead,
  showCover = true,
  children,
}: {
  project: Project;
  locale: string;
  title: string;
  subtitle: string;
  /** One or two sentences shown large above the sections */
  lead?: string;
  showCover?: boolean;
  children: React.ReactNode;
}) {
  const tCommon = await getTranslations({ locale, namespace: 'Common' });
  const tProjects = await getTranslations({ locale, namespace: 'ProjectsPage' });

  const area = {
    'autonomous-systems': tProjects('filterAutonomous'),
    sensing: tProjects('filterSensing'),
    'ai-ml': tProjects('filterAiMl'),
  }[project.category];

  const started = project.startDate
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(`${project.startDate}-01T00:00:00Z`),
      )
    : null;

  const cover = showCover && project.coverObjectFit !== 'contain';

  return (
    <article>
      <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} aria-hidden="true" />
          {tCommon('backToProjects')}
        </Link>
        <h1 className="mt-8 max-w-4xl">{title}</h1>
        <p className="mt-4 text-xl text-ink-muted max-w-3xl">{subtitle}</p>
      </header>

      {cover && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-md overflow-hidden bg-surface">
            <Image
              src={project.coverImage}
              alt={project.coverImageAlt}
              fill
              priority
              className="object-cover object-[50%_45%]"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid gap-10 lg:grid-cols-[200px_1fr] lg:gap-16">
        <aside>
          <dl className="lg:sticky lg:top-24 grid grid-cols-2 lg:grid-cols-1 gap-x-6 text-sm">
            <div className="border-t border-line py-3">
              <dt className="text-ink-muted">{tCommon('factStatus')}</dt>
              <dd className="mt-1"><StatusBadge status={project.status} /></dd>
            </div>
            {started && (
              <div className="border-t border-line py-3">
                <dt className="text-ink-muted">{tCommon('factStart')}</dt>
                <dd className="mt-1 text-ink">{started}</dd>
              </div>
            )}
            <div className="border-t border-line py-3">
              <dt className="text-ink-muted">{tCommon('factArea')}</dt>
              <dd className="mt-1 text-ink">{area}</dd>
            </div>
            <div className="border-t border-line py-3 col-span-2 lg:col-span-1">
              <dt className="text-ink-muted">{tCommon('factTech')}</dt>
              <dd className="mt-1 text-ink leading-relaxed">{project.tags.join(', ')}</dd>
            </div>
          </dl>
        </aside>

        <div className="min-w-0 space-y-14">
          {lead && <p className="text-xl sm:text-2xl leading-snug text-ink max-w-3xl">{lead}</p>}
          {children}
          {project.publications && project.publications.length > 0 && (
            <Section title={tCommon('publications')}>
              {project.publications.map((pub) => (
                <PublicationCard key={pub.doi} publication={pub} />
              ))}
            </Section>
          )}
        </div>
      </div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl sm:text-[1.75rem]">{title}</h2>
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-lg text-ink-soft max-w-2xl">{children}</p>;
}
