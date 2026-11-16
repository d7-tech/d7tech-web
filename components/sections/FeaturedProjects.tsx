import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import ProjectTile from '@/components/projects/ProjectTile';
import Reveal from '@/components/motion/Reveal';
import { getProjectBySlug } from '@/lib/data/projects';

const get = (s: string) => getProjectBySlug(s)!;

export default function FeaturedProjects() {
  const t = useTranslations('FeaturedProjects');

  return (
    <section className="py-16 sm:py-24" aria-labelledby="featured-projects-heading">
      <div className="wrap">
        <Reveal className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <p className="label">{t('label')}</p>
            <h2 id="featured-projects-heading" className="mt-4">{t('heading')}</h2>
            <p className="mt-4 text-lg max-w-lg">{t('text')}</p>
          </div>
          <Link href="/projects" className="btn btn-primary self-start lg:self-auto">
            {t('allProjects')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2">
          <Reveal><ProjectTile project={get('micro-climate')} className="h-[420px] sm:h-[520px]" /></Reveal>
          <Reveal delay={0.12}><ProjectTile project={get('multistatic')} className="h-[420px] sm:h-[520px]" /></Reveal>
        </div>
      </div>

      <div className="wrap mt-3">
        <ProjectTile project={get('advisor')} wide className="h-[70svh] min-h-[440px] max-h-[760px]" />
      </div>

      <div className="wrap mt-3 grid gap-3 sm:grid-cols-3">
        {['wearable-sensors', 'warehouse-automation', 'underwater-gliders'].map((s, i) => (
          <Reveal key={s} delay={i * 0.1}>
            <ProjectTile project={get(s)} className="h-[380px] sm:h-[440px]" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
