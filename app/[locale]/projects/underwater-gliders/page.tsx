import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'UnderwaterGlidersPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/underwater-gliders'),
  };
}

export default async function UnderwaterGlidersPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'UnderwaterGlidersPage' });
  const project = getProjectBySlug('underwater-gliders')!;

  return (
    <ProjectLayout project={project} locale={params.locale} title={t('title')} subtitle={t('subtitle')} lead={t('description')}>
      <Section title={t('researchTitle')}>
        <Body>{t('updatesComingSoon')}</Body>
      </Section>
    </ProjectLayout>
  );
}
