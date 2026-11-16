import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const t = useTranslations('Hero');
  const tAbout = useTranslations('AboutPage');
  const tProject = useTranslations('ProjectData');

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20">
      <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.25fr_1fr] items-center">
        <div>
          <h1 className="font-medium text-[1.9rem] sm:text-[2.4rem] lg:text-[2.75rem] leading-[1.18] max-w-[22ch] lg:max-w-none">
            {t('headline')}
          </h1>
          <p className="mt-6 text-lg text-ink-soft max-w-xl">{tAbout('missionP2')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand text-white text-[15px] font-medium hover:bg-brand-dark transition-colors"
            >
              {t('viewProjects')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/contact" className="text-[15px] font-medium text-brand hover:underline">
              {t('contactUs')}
            </Link>
          </div>
        </div>

        <figure className="m-0">
          <Link href="/projects/advisor" className="block relative aspect-[4/5] max-h-[560px] w-full rounded-md overflow-hidden bg-surface">
            <Image
              src="/images/projects/advisor.jpg"
              alt={tProject('advisor.title')}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </Link>
          <figcaption className="mt-3 text-sm text-ink-muted">
            <Link href="/projects/advisor" className="hover:text-ink hover:underline">
              {tProject('advisor.title')}
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
