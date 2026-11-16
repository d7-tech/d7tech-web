import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Project } from '@/lib/data/projects';
import StatusBadge from '@/components/common/StatusBadge';

interface ProjectCardProps {
  project: Project;
  priority?: boolean;
}

export default function ProjectCard({ project, priority = false }: ProjectCardProps) {
  const t = useTranslations('ProjectData');
  const title = t(`${project.slug}.title` as any);
  const subtitle = t(`${project.slug}.subtitle` as any);

  return (
    <article>
      <Link href={`/projects/${project.slug}`} className="group block">
        <div className="relative aspect-[3/2] rounded-md overflow-hidden bg-surface border border-line">
          <Image
            src={project.coverImage}
            alt={project.coverImageAlt}
            fill
            priority={priority}
            className={`${project.coverObjectFit === 'contain' ? 'object-contain p-4' : 'object-cover'} transition-opacity group-hover:opacity-90`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
          />
        </div>
        <StatusBadge status={project.status} className="mt-4" />
        <h3 className="mt-1 text-lg group-hover:text-brand group-hover:underline decoration-1">{title}</h3>
        <p className="mt-1.5 text-[15px] text-ink-muted leading-relaxed line-clamp-2">{subtitle}</p>
      </Link>
    </article>
  );
}
