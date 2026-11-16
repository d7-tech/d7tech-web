import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import TechTag from '@/components/common/TechTag';
import ProjectCover from '@/components/projects/ProjectCover';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'AdvisorPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/advisor'),
  };
}

export default async function AdvisorPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'AdvisorPage' });
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'Common' });
  const project = getProjectBySlug('advisor')!;

  const sensors = [
    { name: 'IMU', full: t('imuFull'), desc: t('imuDesc') },
    { name: 'GNSS', full: t('gnssFull'), desc: t('gnssDesc') },
    { name: 'Camera', full: t('cameraFull'), desc: t('cameraDesc') },
    { name: 'LiDAR', full: t('lidarFull'), desc: t('lidarDesc') },
    { name: 'RADAR', full: t('radarFull'), desc: t('radarDesc') },
    { name: 'MET', full: t('metFull'), desc: t('metDesc') },
  ];

  return (
    <article>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-8">
          <ArrowLeft size={14} aria-hidden="true" />
          {tCommon('backToProjects')}
        </Link>

        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
            <StatusBadge status={project.status} />
            <span className="text-[13px] text-ink-muted">·</span>
            <span className="text-[13px] text-ink-muted">{project.startDate} – {t('present')}</span>
          </div>
          <h1 className="mb-3">{t('title')}</h1>
          <p className="text-lg text-ink-soft mb-5">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => <TechTag key={tag} tag={tag} />)}
          </div>
          <div className="mt-8">
            <ProjectCover src={project.coverImage} alt={project.coverImageAlt} priority sizes="(max-width: 896px) 100vw, 896px" />
          </div>
        </header>

        <div className="h-px bg-line mb-10" aria-hidden="true" />

        <section className="mb-12" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-[1.35rem] mb-3">{t('overviewTitle')}</h2>
          <p className="text-[17px] leading-[1.75]">{t('overviewText')}</p>
        </section>

        <section className="mb-12" aria-labelledby="field-trial-heading">
          <h2 id="field-trial-heading" className="text-[1.35rem] mb-3">{t('fieldTrialTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-6">{t('fieldTrialText')}</p>
          <figure className="m-0">
            <div className="relative w-full aspect-video rounded-md bg-white border border-line overflow-hidden">
              <Image src="/images/projects/advisor_field_trial.png" alt={t('fieldTrialImageAlt')} fill className="object-contain" sizes="(max-width: 896px) 100vw, 896px" />
            </div>
            <figcaption className="mt-2.5 text-sm text-ink-muted">{t('fieldTrialCaption')}</figcaption>
          </figure>
        </section>

        <section className="mb-12" aria-labelledby="navigation-heading">
          <h2 id="navigation-heading" className="text-[1.35rem] mb-3">{t('navTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-6">{t('navText')}</p>
          <div className="border-y border-line text-[15px]" role="table" aria-label={t('sensorTableLabel')}>
            <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[80px_1fr_1.3fr] border-b border-line" role="row">
              <div className="py-2.5 pr-4 text-sm font-medium text-ink" role="columnheader">{t('sensorColSensor')}</div>
              <div className="py-2.5 pr-4 text-sm font-medium text-ink" role="columnheader">{t('sensorColSystem')}</div>
              <div className="hidden sm:block py-2.5 text-sm font-medium text-ink" role="columnheader">{t('sensorColFunction')}</div>
            </div>
            {sensors.map((s) => (
              <div key={s.name} className="grid grid-cols-[72px_1fr] sm:grid-cols-[80px_1fr_1.3fr] border-b border-line last:border-0" role="row">
                <div className="py-3 pr-4 font-medium text-ink" role="cell">{s.name}</div>
                <div className="py-3 pr-4 text-ink-soft" role="cell">{s.full}<span className="sm:hidden block text-ink-muted text-sm mt-0.5">{s.desc}</span></div>
                <div className="hidden sm:block py-3 text-ink-muted" role="cell">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12" aria-labelledby="bathymetry-heading">
          <h2 id="bathymetry-heading" className="text-[1.35rem] mb-3">{t('bathyTitle')}</h2>
          <p className="text-[17px] leading-[1.75] mb-4">{t('bathyText1')}</p>
          <p className="text-[17px] leading-[1.75]">{t('bathyText2')}</p>
        </section>
      </div>
    </article>
  );
}
