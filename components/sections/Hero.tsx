import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

/** Split hero: text on the dark panel, the (portrait) ADVISOR photo beside it. */
export default function Hero() {
  const t = useTranslations('Hero');

  return (
    <section className="bg-night">
      <div className="grid lg:grid-cols-2 lg:h-[88svh] lg:min-h-[600px] lg:max-h-[860px]">
        <div className="order-2 lg:order-1 flex items-end">
          <div className="w-full lg:max-w-[576px] lg:ml-auto px-4 sm:px-6 lg:px-8 lg:pr-12 pt-10 pb-14 sm:pb-20">
            <h1 className="text-white text-[2.5rem] sm:text-6xl lg:text-[3.75rem] leading-[1.03]">
              {t('headline')}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-night-soft">{t('subtext')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-white text-ink text-[15px] font-medium hover:bg-white/90 transition-colors"
              >
                {t('viewProjects')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-5 py-3 rounded-md border border-white/30 text-white text-[15px] font-medium hover:bg-white/10 transition-colors"
              >
                {t('contactUs')}
              </Link>
            </div>
          </div>
        </div>

        <figure className="order-1 lg:order-2 relative m-0 aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto">
          <Image
            src="/images/projects/advisor.jpg"
            alt={t('photoCaption')}
            fill
            priority
            className="object-cover object-[50%_40%]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {/* Keeps the navigation readable over the bright sky */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/70 to-transparent" aria-hidden="true" />
          <figcaption className="absolute bottom-4 right-4 sm:right-6 text-xs text-white/70">{t('photoCaption')}</figcaption>
        </figure>
      </div>
    </section>
  );
}
