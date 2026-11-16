import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import SectionFigure from '@/components/projects/SectionFigure';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'MultistaticPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/multistatic'),
  };
}

export default async function MultistaticPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'MultistaticPage' });
  const project = getProjectBySlug('multistatic')!;

  return (
    <ProjectLayout project={project} locale={params.locale} title={t('title')} subtitle={t('subtitle')} lead={t('overviewText')}>
      <Section title={t('simulationTitle')}>
        <Body>{t('simulationText')}</Body>
        <SectionFigure src="/images/projects/simulation_map.png" alt={t('simulationImageAlt')} caption={t('simulationCaption')} />
      </Section>

      {project.youtubeEmbed && (
        <Section title={t('demoTitle')}>
          <Body>{t('demoText')}</Body>
          <div className="relative w-full aspect-video overflow-hidden bg-night border border-line">
            <iframe
              src={project.youtubeEmbed}
              title={t('demoIframeTitle')}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Section>
      )}
    </ProjectLayout>
  );
}
