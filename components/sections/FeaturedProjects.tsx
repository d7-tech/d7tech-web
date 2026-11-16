import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import ProjectTile from '@/components/projects/ProjectTile';
import { getProjectBySlug } from '@/lib/data/projects';

const SLUGS = ['advisor', 'indoor-positioning', 'micro-climate', 'multistatic', 'wearable-sensors', 'warehouse-automation'];

/** Project grid: the lead project large, the rest as tiles. */
export default function FeaturedProjects() {
  const t = useTranslations('FeaturedProjects');
  const [lead, ...rest] = SLUGS.map((s) => getProjectBySlug(s)!);

  return (
    <section aria-labelledby="featured-projects-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="flex items-end justify-between gap-4 mb-10">
          <h2 id="featured-projects-heading">{t('heading')}</h2>
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand-light hover:text-ink whitespace-nowrap">
            {t('allProjects')}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[300px] lg:auto-rows-[290px]">
          <ProjectTile project={lead} large priority className="sm:col-span-2 lg:row-span-2" />
          {rest.map((p) => (
            <ProjectTile key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
