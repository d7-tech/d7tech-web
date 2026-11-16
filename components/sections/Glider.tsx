import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import GliderVisual from '@/components/sections/GliderVisual';
import DiveProfile from '@/components/anim/DiveProfile';

/** The autonomous underwater glider: the render gliding through its panel, and how it moves. */
export default function Glider() {
  const t = useTranslations('Glider');
  const tProject = useTranslations('ProjectData');
  const tPage = useTranslations('UnderwaterGlidersPage');

  return (
    <section className="py-16 sm:py-24" aria-labelledby="glider-heading">
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

        <GliderVisual alt={tProject('underwater-gliders.title')} />

        <Reveal className="mt-3 rounded bg-[#0f151c] p-5 sm:p-8">
          <DiveProfile labels={{ dive: t('dive'), climb: t('climb'), uplink: t('uplink') }} />
          <ul className="mt-5 grid gap-3 sm:grid-cols-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[#8b95a3]">
            <li>↘ {t('legendDive')}</li>
            <li>↗ {t('legendClimb')}</li>
            <li className="text-[#7aa6f0]">◠ {t('legendUplink')}</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
