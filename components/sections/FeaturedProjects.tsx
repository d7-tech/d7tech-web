import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import ProjectCard from '@/components/projects/ProjectCard';
import StatusBadge from '@/components/common/StatusBadge';
import { getProjectBySlug } from '@/lib/data/projects';

const LEAD = 'advisor';
const REST = ['micro-climate', 'multistatic', 'wearable-sensors', 'warehouse-automation'];

export default function FeaturedProjects() {
  const t = useTranslations('FeaturedProjects');
  const tProject = useTranslations('ProjectData');
  const lead = getProjectBySlug(LEAD)!;
  const rest = REST.map((s) => getProjectBySlug(s)!).filter(Boolean);

  return (
    <section className="bg-night text-night-soft" aria-labelledby="featured-projects-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="flex items-end justify-between gap-4 mb-12">
          <h2 id="featured-projects-heading" className="text-white">{t('heading')}</h2>
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-white hover:underline whitespace-nowrap">
            {t('allProjects')}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {/* Lead project: large image with text beside it */}
        <Link href={`/projects/${lead.slug}`} className="group grid gap-8 lg:grid-cols-[1.5fr_1fr] items-center mb-16 sm:mb-20">
          <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-night-line">
            <Image
              src={lead.coverImage}
              alt={lead.coverImageAlt}
              fill
              className="object-cover object-[50%_45%] transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 640px"
            />
          </div>
          <div>
            <StatusBadge status={lead.status} tone="dark" />
            <h3 className="mt-2 text-2xl sm:text-3xl text-white group-hover:underline decoration-1 underline-offset-4">
              {tProject(`${lead.slug}.title` as any)}
            </h3>
            <p className="mt-3 text-lg">{tProject(`${lead.slug}.subtitle` as any)}</p>
          </div>
        </Link>

        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
          {rest.map((project) => (
            <ProjectCard key={project.id} project={project} tone="dark" />
          ))}
        </div>
      </div>
    </section>
  );
}
