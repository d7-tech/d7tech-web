import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import SectionFigure from '@/components/projects/SectionFigure';
import { PanelFigure } from '@/components/anim/SensingLayers';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'WearableSensorsPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/wearable-sensors'),
  };
}

export default async function WearableSensorsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'WearableSensorsPage' });
  const project = getProjectBySlug('wearable-sensors')!;

  return (
    <ProjectLayout project={project} locale={params.locale} title={t('title')} subtitle={t('subtitle')} lead={t('overviewText')}>
      <Section title={t('localizationTitle')}>
        <Body>{t('localizationText')}</Body>
        <div className="grid gap-6 md:grid-cols-2 items-start">
          <SectionFigure src="/images/projects/controlled_localization.jpg" alt={t('localizationImageAlt')} caption={t('localizationCaption')} />
          <PanelFigure kind="uwb" caption={t('uwbAnimCaption')} />
        </div>
      </Section>

      <Section title={t('motionTitle')}>
        <Body>{t('motionText')}</Body>
        <div className="grid gap-6 md:grid-cols-2 items-start">
          <SectionFigure src="/images/projects/data_driven_motion.jpg" alt={t('motionImageAlt')} caption={t('motionCaption')} />
          <PanelFigure kind="imu" caption={t('imuAnimCaption')} />
        </div>
      </Section>

      <Section title={t('fieldTitle')}>
        <Body>{t('fieldText')}</Body>
        <SectionFigure src="/images/projects/field_experiments.jpg" alt={t('fieldImageAlt')} caption={t('fieldCaption')} />
      </Section>
    </ProjectLayout>
  );
}
