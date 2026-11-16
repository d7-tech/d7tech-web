import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import ProjectCard from '@/components/projects/ProjectCard';
import { projects } from '@/lib/data/projects';

// Most recent / active work first on the home page.
const ORDER = ['advisor', 'micro-climate', 'multistatic', 'wearable-sensors', 'warehouse-automation', 'underwater-gliders'];

export default function FeaturedProjects() {
  const t = useTranslations('FeaturedProjects');
  const ordered = [...projects].sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));

  return (
    <section className="border-t border-line" aria-labelledby="featured-projects-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-baseline justify-between gap-4 mb-10">
          <div>
            <h2 id="featured-projects-heading">{t('heading')}</h2>
            <p className="mt-2 text-ink-muted">{t('description')}</p>
          </div>
          <Link href="/projects" className="hidden sm:inline-flex items-center gap-1.5 text-[15px] font-medium text-brand hover:underline whitespace-nowrap">
            {t('allProjects')}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((project, i) => (
            <ProjectCard key={project.id} project={project} priority={i < 3} />
          ))}
        </div>

        <Link href="/projects" className="sm:hidden mt-10 inline-flex items-center gap-1.5 text-[15px] font-medium text-brand">
          {t('allProjects')}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
