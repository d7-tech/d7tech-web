import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import { getProjectBySlug } from '@/lib/data/projects';
import TrackingField from '@/components/anim/TrackingField';

const SLUG = 'indoor-positioning';

/** Slate card: one project on the left; on the right its pool photo turns into the live tracking diagram as you scroll. */
export default function FeatureCard() {
  const t = useTranslations('FeaturedVideo');
  const tProject = useTranslations('ProjectData');
  const project = getProjectBySlug(SLUG)!;
  const tA = useTranslations('Anim');
  const labels = { range: tA('range'), raw: tA('raw'), fused: tA('fused'), marker: tA('marker'), camera: tA('camera') };

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
          <div className="bg-[#0f151c] p-5 sm:p-8 flex items-center">
            <TrackingField
              labels={labels}
              className="w-full"
              entry={{
                photo: '/images/projects/indoor-positioning.jpg',
                photoAlt: tProject(`${SLUG}.title`),
                photoW: 2560,
                photoH: 1440,
                sprite: '/images/projects/model-ship.png',
                spriteAspect: 366 / 144,
                // the model ship in the photo: x 687-779, y 292-328 of 1280 x 720
                ship: { cx: 733 / 1280, cy: 310 / 720, w: 92 / 1280 },
              }}
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
