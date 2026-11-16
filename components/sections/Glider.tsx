import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import GliderDive from '@/components/anim/GliderDive';

/** The autonomous underwater glider: the render gliding through its panel, and how it moves. */
export default function Glider() {
  const t = useTranslations('Glider');
  const tProject = useTranslations('ProjectData');
  const tPage = useTranslations('UnderwaterGlidersPage');

  return (
    <section className="py-16 sm:py-24 overflow-x-clip" aria-labelledby="glider-heading">
      <div className="wrap">
        <Reveal className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <p className="label">{t('label')}</p>
            <h2 id="glider-heading" className="mt-4 max-w-3xl">{tProject('underwater-gliders.title')}</h2>
            <p className="mt-4 text-lg max-w-xl">{tPage('description')}</p>
          </div>
          <Link href="/projects/underwater-gliders" className="btn btn-primary self-start lg:self-auto">
            {t('cta')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </Reveal>

        <GliderDive
          alt={tProject('underwater-gliders.title')}
          phases={{ dive: t('dive'), climb: t('climb'), uplink: t('uplink') }}
          howTitle={t('howTitle')}
          steps={{
            sink: { title: t('steps.sink.title'), text: t('steps.sink.text') },
            turn: { title: t('steps.turn.title'), text: t('steps.turn.text') },
            climb: { title: t('steps.climb.title'), text: t('steps.climb.text') },
            surface: { title: t('steps.surface.title'), text: t('steps.surface.text') },
          }}
        />
      </div>
    </section>
  );
}
