import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import LiveStation from '@/components/sections/LiveStation';
import Parallax from '@/components/motion/Parallax';
import Reveal from '@/components/motion/Reveal';

/** Full-screen photo hero: headline top left, intro and actions bottom right, station readings along the bottom. */
export default function Hero() {
  const t = useTranslations('Hero');

  return (
    <section className="on-dark relative h-[100svh] min-h-[620px] max-h-[1000px] flex flex-col overflow-hidden">
      <Parallax className="absolute inset-0">
        <Image
          src="/images/projects/advisor.jpg"
          alt={t('photoCaption')}
          fill
          priority
          className="object-cover object-[50%_46%]"
          sizes="100vw"
          quality={90}
        />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f151c]/75 via-[#0f151c]/10 to-[#0f151c]/85" aria-hidden="true" />

      <div className="wrap relative flex-1 flex flex-col justify-between pt-28 sm:pt-32 pb-10">
        <Reveal>
          <h1 className="max-w-4xl">{t('headline')}</h1>
        </Reveal>
        <Reveal delay={0.2} className="self-end w-full max-w-md">
          <p className="label">{t('kicker')}</p>
          <p className="mt-3 text-xl leading-snug text-ink">{t('subtext')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/projects" className="btn btn-primary">
              {t('viewProjects')}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              {t('contactUs')}
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="relative">
        <LiveStation />
      </div>
    </section>
  );
}
