import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import { getProjectBySlug } from '@/lib/data/projects';

const SLUG = 'indoor-positioning';

/** Slate card: one project, its text on the left and its video on the right. */
export default function FeatureCard() {
  const t = useTranslations('FeaturedVideo');
  const tProject = useTranslations('ProjectData');
  const project = getProjectBySlug(SLUG)!;

  return (
    <section className="wrap py-16 sm:py-24" aria-labelledby="feature-heading">
      <Reveal>
        <div className="on-dark grid lg:grid-cols-[1fr_1.35fr] rounded overflow-hidden">
          <div className="flex flex-col justify-between gap-10 p-6 sm:p-10">
            <div className="flex items-center justify-between">
              <p className="label">{t('label')} · {project.partner}</p>
              <span className="w-1.5 h-1.5 rounded-full bg-signal" aria-hidden="true" />
            </div>
            <div>
              <h2 id="feature-heading" className="text-3xl sm:text-4xl">{tProject(`${SLUG}.title`)}</h2>
              <p className="mt-4 max-w-md">{tProject(`${SLUG}.subtitle`)}</p>
              <Link href={`/projects/${SLUG}`} className="btn btn-primary mt-7">
                {t('cta')}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <video
            className="w-full h-full min-h-[260px] object-cover bg-night"
            src={project.video}
            poster={project.videoPoster}
            controls
            playsInline
            preload="none"
            aria-label={t('watch')}
          />
        </div>
      </Reveal>
    </section>
  );
}
