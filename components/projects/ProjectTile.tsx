import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '@/lib/data/projects';

/** Dark image tile with the title over the picture. Size comes from the grid. */
export default function ProjectTile({
  project,
  className = '',
  large = false,
  priority = false,
}: {
  project: Project;
  className?: string;
  large?: boolean;
  priority?: boolean;
}) {
  const t = useTranslations('ProjectData');
  const tStatus = useTranslations('StatusBadge');
  const tProjects = useTranslations('ProjectsPage');

  const area = {
    'autonomous-systems': tProjects('filterAutonomous'),
    sensing: tProjects('filterSensing'),
    'ai-ml': tProjects('filterAiMl'),
  }[project.category];
  const status = { active: tStatus('active'), completed: tStatus('completed'), 'in-development': tStatus('inDevelopment') }[project.status];

  const src = project.tileImage ?? project.coverImage;
  const contain = !project.tileImage && project.coverObjectFit === 'contain';

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative block overflow-hidden bg-surface border border-line hover:border-ink-muted/60 transition-colors ${className}`}
    >
      <Image
        src={src}
        alt={project.coverImageAlt}
        fill
        priority={priority}
        className={`${contain ? 'object-contain p-8 bg-white' : 'object-cover'} transition-transform duration-700 group-hover:scale-[1.03]`}
        sizes={large ? '(max-width: 1024px) 100vw, 760px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/50 to-transparent" aria-hidden="true" />
      <ArrowUpRight
        size={20}
        className="absolute top-4 right-4 text-ink-muted group-hover:text-ink transition-colors"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          {area} · {status}
        </p>
        <h3 className={`mt-2 font-display font-semibold uppercase leading-[1.05] text-ink ${large ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
          {t(`${project.slug}.title` as any)}
        </h3>
        {large && <p className="mt-2 text-ink-soft max-w-lg">{t(`${project.slug}.subtitle` as any)}</p>}
      </div>
    </Link>
  );
}
