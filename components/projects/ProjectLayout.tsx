import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import PublicationCard from '@/components/projects/PublicationCard';
import Parallax from '@/components/motion/Parallax';
import Reveal from '@/components/motion/Reveal';
import type { Project } from '@/lib/data/projects';

/** Product-style page: full-bleed photo with the name, a slate spec band, then the sections. */
export default async function ProjectLayout({
  project,
  locale,
  title,
  subtitle,
  lead,
  showCover = true,
  dark = false,
  children,
}: {
  project: Project;
  locale: string;
  title: string;
  subtitle: string;
  /** One or two sentences shown large above the sections */
  lead?: string;
  showCover?: boolean;
  /** Slate body, for data-heavy pages */
  dark?: boolean;
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
    { label: tCommon('factStatus'), value: <StatusBadge status={project.status} className="!text-base !text-ink" /> },
    ...(started ? [{ label: tCommon('factStart'), value: started }] : []),
    ...(project.partner ? [{ label: tCommon('factPartner'), value: project.partner }] : []),
    { label: tCommon('factArea'), value: area },
    { label: tCommon('factTech'), value: project.tags.join(' · ') },
  ];

  const back = (
    <Link href="/projects" className="label inline-flex items-center gap-1.5 hover:!text-ink">
      <ArrowLeft size={13} aria-hidden="true" />
      {tCommon('backToProjects')}
    </Link>
  );

  return (
    <article>
      <header className={`on-dark relative flex flex-col overflow-hidden ${cover ? 'h-[78svh] min-h-[520px] max-h-[860px]' : 'pt-10'}`}>
        {cover && (
          <>
            <Parallax className="absolute inset-0">
              <Image
                src={project.coverImage}
                alt={project.coverImageAlt}
                fill
                priority
                className="object-cover object-[50%_45%]"
                sizes="100vw"
              />
            </Parallax>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f151c]/60 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-[#0f151c]/95 via-[#0f151c]/60 to-transparent" aria-hidden="true" />
          </>
        )}
        <div className={`wrap relative flex-1 flex flex-col justify-between gap-16 pb-12 sm:pb-16 ${cover ? 'pt-24' : 'pt-6'}`}>
          {back}
          <Reveal>
            <h1 className="max-w-5xl">{title}</h1>
            <p className="mt-5 text-xl text-ink-soft max-w-2xl">{subtitle}</p>
          </Reveal>
        </div>
      </header>

      {/* Spec band */}
      <div className="on-dark deeper">
        <dl className={`wrap grid grid-cols-2 ${facts.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {facts.map((f, i) => (
            <div key={f.label} className={`py-6 pr-4 border-t border-line lg:border-t-0 ${i > 0 ? 'lg:border-l lg:pl-6' : ''}`}>
              <dt className="label">{f.label}</dt>
              <dd className="mt-2 text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={dark ? 'on-dark' : ''}>
        <div className="wrap py-16 sm:py-24 space-y-20 sm:space-y-28">
          {lead && (
            <Reveal>
              <p className="text-2xl sm:text-[2rem] leading-[1.25] tracking-[-0.02em] text-ink max-w-4xl">{lead}</p>
            </Reveal>
          )}
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
    <Reveal as="section" className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16 border-t border-line pt-8">
      <h2 className="text-3xl sm:text-4xl">{title}</h2>
      <div className="min-w-0 space-y-8">{children}</div>
    </Reveal>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-lg text-ink-soft max-w-2xl">{children}</p>;
}
