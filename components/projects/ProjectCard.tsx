import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Project } from '@/lib/data/projects';
import StatusBadge from '@/components/common/StatusBadge';

interface ProjectCardProps {
  project: Project;
  priority?: boolean;
  /** 'dark' when the card sits on a night section */
  tone?: 'light' | 'dark';
}

export default function ProjectCard({ project, priority = false, tone = 'light' }: ProjectCardProps) {
  const t = useTranslations('ProjectData');
  const dark = tone === 'dark';
  const contain = project.coverObjectFit === 'contain';

  return (
    <article>
      <Link href={`/projects/${project.slug}`} className="group block">
        <div className={`relative aspect-[16/10] rounded-md overflow-hidden ${contain ? 'bg-white' : dark ? 'bg-night-line' : 'bg-surface'}`}>
          <Image
            src={project.coverImage}
            alt={project.coverImageAlt}
            fill
            priority={priority}
            className={`${contain ? 'object-contain p-6' : 'object-cover'} transition-transform duration-500 group-hover:scale-[1.02]`}
            sizes="(max-width: 640px) 100vw, 560px"
          />
        </div>
        <StatusBadge status={project.status} tone={tone} className="mt-5" />
        <h3 className={`mt-1.5 text-xl group-hover:underline decoration-1 underline-offset-4 ${dark ? 'text-white' : ''}`}>
          {t(`${project.slug}.title` as any)}
        </h3>
        <p className={`mt-1.5 ${dark ? 'text-night-soft' : 'text-ink-muted'}`}>{t(`${project.slug}.subtitle` as any)}</p>
      </Link>
    </article>
  );
}
