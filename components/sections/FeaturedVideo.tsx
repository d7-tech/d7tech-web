import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { getProjectBySlug } from '@/lib/data/projects';
import SensingLayers from '@/components/anim/SensingLayers';

const SLUG = 'indoor-positioning';

/** One project told through its video. */
export default function FeaturedVideo() {
  const t = useTranslations('FeaturedVideo');
  const tProject = useTranslations('ProjectData');
  const tPage = useTranslations('IndoorPositioningPage');
  const layers = (['uwb', 'optical', 'inertial'] as const).map((k) => ({ name: tPage(`layers.${k}.name`) }));
  const project = getProjectBySlug(SLUG)!;

  return (
    <section className="bg-surface border-y border-line" aria-labelledby="featured-video-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 grid gap-10 lg:grid-cols-[1.55fr_1fr] items-center">
        <video
          className="w-full aspect-video bg-night border border-line"
          src={project.video}
          poster={project.videoPoster}
          controls
          playsInline
          preload="none"
          aria-label={tProject(`${SLUG}.title`)}
        />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            {t('label')} · {project.partner}
          </p>
          <h2 id="featured-video-heading" className="mt-4">{tProject(`${SLUG}.title`)}</h2>
          <p className="mt-4 text-lg text-ink-soft">{tProject(`${SLUG}.subtitle`)}</p>
          <Link
            href={`/projects/${SLUG}`}
            className="mt-7 inline-flex items-center gap-2 text-[15px] font-medium text-brand-light hover:text-ink"
          >
            {t('cta')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="lg:col-span-2">
          <SensingLayers items={layers} />
        </div>
      </div>
    </section>
  );
}
