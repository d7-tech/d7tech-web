import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Project } from '@/lib/data/projects';
import ExpandMedia from '@/components/motion/ExpandMedia';

/** Photo tile with the project name over the picture. `wide` opens up on scroll. */
export default function ProjectTile({
  project,
  className = '',
  wide = false,
  priority = false,
}: {
  project: Project;
  className?: string;
  wide?: boolean;
  priority?: boolean;
}) {
  const t = useTranslations('ProjectData');
  const tF = useTranslations('FeaturedProjects');
  const src = project.tileImage ?? project.coverImage;
  const contain = !project.tileImage && project.coverObjectFit === 'contain';

  const image = (
    <Image
      src={src}
      alt={project.coverImageAlt}
      fill
      priority={priority}
      className={`${contain ? 'object-contain p-10 bg-white' : 'object-cover'} transition-transform [transition-duration:1200ms] ease-out group-hover:scale-[1.04]`}
      sizes={wide ? '100vw' : '(max-width: 640px) 100vw, 50vw'}
    />
  );

  const text = (
    <div className="absolute inset-x-0 bottom-0 rounded-b p-5 sm:p-7 bg-gradient-to-t from-[#0f151c]/80 via-[#0f151c]/30 to-transparent pt-24">
      <h3 className={`text-white tracking-tight leading-[1.05] ${wide ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'}`}>
        {t(`${project.slug}.title` as any)}
      </h3>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-white/75">↳ {tF('details')}</p>
    </div>
  );

  return (
    <Link href={`/projects/${project.slug}`} className={`group relative block ${className}`}>
      {wide ? (
        <ExpandMedia className="h-full bg-night" overlay={text}>{image}</ExpandMedia>
      ) : (
        <>
          <div className="absolute inset-0 overflow-hidden rounded bg-night">{image}</div>
          {text}
        </>
      )}
    </Link>
  );
}
