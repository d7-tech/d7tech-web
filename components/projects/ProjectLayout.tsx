import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import PublicationCard from '@/components/projects/PublicationCard';
import type { Project } from '@/lib/data/projects';

/** Case-study page: image header, a spec bar, then sections with the heading on the left. */
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

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: tCommon('factStatus'), value: <StatusBadge status={project.status} className="!text-sm !text-ink" /> },
    ...(started ? [{ label: tCommon('factStart'), value: started }] : []),
    ...(project.partner ? [{ label: tCommon('factPartner'), value: project.partner }] : []),
    { label: tCommon('factArea'), value: area },
    { label: tCommon('factTech'), value: project.tags.join(' · ') },
  ];

  const back = (
    <Link href="/projects" className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted hover:text-ink">
      <ArrowLeft size={13} aria-hidden="true" />
      {tCommon('backToProjects')}
    </Link>
  );

  return (
    <article>
      {cover ? (
        <header className="relative h-[62svh] min-h-[440px] max-h-[680px] flex flex-col bg-night overflow-hidden">
          <Image
            src={project.coverImage}
            alt={project.coverImageAlt}
            fill
            priority
            className="object-cover object-[50%_45%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/40 to-paper/30" aria-hidden="true" />
          <div className="relative flex-1 flex flex-col justify-between w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pb-14">
            {back}
            <div>
              <h1 className="max-w-4xl">{title}</h1>
              <p className="mt-4 text-lg sm:text-xl text-ink-soft max-w-3xl">{subtitle}</p>
            </div>
          </div>
        </header>
      ) : (
        <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-10 sm:pb-14">
          {back}
          <h1 className="mt-10 max-w-4xl">{title}</h1>
          <p className="mt-4 text-lg sm:text-xl text-ink-soft max-w-3xl">{subtitle}</p>
        </header>
      )}

      {/* Spec bar */}
      <div className="border-y border-line bg-surface">
        <dl className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 ${facts.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {facts.map((f, i) => (
            <div key={f.label} className={`py-5 pr-4 ${i > 0 ? 'lg:border-l lg:border-line lg:pl-6' : ''}`}>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{f.label}</dt>
              <dd className="mt-1.5 text-sm text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16 sm:space-y-20">
        {lead && <p className="text-xl sm:text-2xl leading-snug text-ink max-w-3xl lg:ml-[calc(260px+4rem)]">{lead}</p>}
        {children}
        {project.publications && project.publications.length > 0 && (
          <Section title={tCommon('publications')}>
            {project.publications.map((pub) => (
              <PublicationCard key={pub.doi} publication={pub} />
            ))}
          </Section>
        )}
      </div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-16 border-t border-line pt-8">
      <h2 className="text-2xl sm:text-[1.75rem]">{title}</h2>
      <div className="min-w-0 space-y-6">{children}</div>
    </section>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-lg text-ink-soft max-w-2xl">{children}</p>;
}
