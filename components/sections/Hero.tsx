import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import TrackingField from '@/components/anim/TrackingField';
import LiveStation from '@/components/sections/LiveStation';

/** Hero: headline beside a live diagram of our indoor positioning system, station readings along the bottom. */
export default function Hero() {
  const t = useTranslations('Hero');
  const tA = useTranslations('Anim');
  const labels = { range: tA('range'), raw: tA('raw'), fused: tA('fused'), marker: tA('marker'), camera: tA('camera') };

  return (
    <section className="relative lg:min-h-[88svh] lg:max-h-[900px] flex flex-col bg-paper overflow-hidden">
      <div className="relative flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-14 grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-14 items-center">
          <div>
            <h1 className="text-[2.5rem] sm:text-6xl lg:text-[3.75rem] leading-[0.98]">{t('headline')}</h1>
            <p className="mt-6 text-lg sm:text-xl text-ink-soft max-w-xl">{t('subtext')}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper text-[15px] font-medium hover:bg-white transition-colors"
              >
                {t('viewProjects')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-5 py-3 border border-ink/30 text-ink text-[15px] font-medium hover:border-ink transition-colors"
              >
                {t('contactUs')}
              </Link>
            </div>
          </div>

          <div>
            <TrackingField labels={labels} />
            <Link
              href="/projects/indoor-positioning"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
            >
              {tA('caption')}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative">
        <LiveStation />
      </div>
    </section>
  );
}
