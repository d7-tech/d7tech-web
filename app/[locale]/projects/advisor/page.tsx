import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import SectionFigure from '@/components/projects/SectionFigure';
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
  const project = getProjectBySlug('advisor')!;
  const sensors = [
    { name: 'IMU', full: t('imuFull'), desc: t('imuDesc') },
    { name: 'GNSS', full: t('gnssFull'), desc: t('gnssDesc') },
    { name: 'Camera', full: t('cameraFull'), desc: t('cameraDesc') },
    { name: 'LiDAR', full: t('lidarFull'), desc: t('lidarDesc') },
    { name: 'Radar', full: t('radarFull'), desc: t('radarDesc') },
    { name: 'MET', full: t('metFull'), desc: t('metDesc') },
  ];

  return (
    <ProjectLayout project={project} locale={params.locale} title={t('title')} subtitle={t('subtitle')} lead={t('overviewText')}>
      <Section title={t('fieldTrialTitle')}>
        <Body>{t('fieldTrialText')}</Body>
        <SectionFigure src="/images/projects/advisor_field_trial.png" alt={t('fieldTrialImageAlt')} caption={t('fieldTrialCaption')} />
      </Section>

      <Section title={t('navTitle')}>
        <Body>{t('navText')}</Body>
        <table className="w-full text-[15px] bg-surface rounded overflow-hidden" aria-label={t('sensorTableLabel')}>
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted border-b border-line">
              <th className="py-3 px-4 font-normal">{t('sensorColSensor')}</th>
              <th className="py-3 pr-4 font-normal">{t('sensorColSystem')}</th>
              <th className="py-3 pr-4 font-normal hidden sm:table-cell">{t('sensorColFunction')}</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((s) => (
              <tr key={s.name} className="border-b border-line last:border-0 align-top">
                <td className="py-3 px-4 font-mono text-sm text-brand-light whitespace-nowrap">{s.name}</td>
                <td className="py-3 pr-4 text-ink-soft">
                  {s.full}
                  <span className="sm:hidden block text-sm text-ink-muted mt-0.5">{s.desc}</span>
                </td>
                <td className="py-3 pr-4 text-ink-muted hidden sm:table-cell">{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title={t('bathyTitle')}>
        <Body>{t('bathyText1')}</Body>
      </Section>
    </ProjectLayout>
  );
}
