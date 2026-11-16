import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import { ExternalLink } from 'lucide-react';
import { getDemoUrl } from '@/lib/demo';
import SectionFigure from '@/components/projects/SectionFigure';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'WarehouseAutomationPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/warehouse-automation'),
  };
}

export default async function WarehouseAutomationPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'WarehouseAutomationPage' });
  const project = getProjectBySlug('warehouse-automation')!;
  const demoUrl = getDemoUrl('warehouse-automation');

  return (
    <ProjectLayout project={project} locale={params.locale} title={t('title')} subtitle={t('subtitle')} lead={t('overviewText')}>
      <Section title={t('approachTitle')}>
        <Body>{t('approachText')}</Body>
      </Section>

      <Section title={t('environmentTitle')}>
        <Body>{t('environmentText')}</Body>
      </Section>

      <Section title={t('platformTitle')}>
        <Body>{t('platformText')}</Body>
        <SectionFigure src="/images/projects/warehouse_simulation_ui.jpg" alt={t('platformFigureAlt')} caption={t('platformFigureCaption')} />
        <div className="grid gap-6 sm:grid-cols-2">
          <SectionFigure src="/images/projects/warehouse_firma_panel.jpg" alt={t('workflowFigureAlt')} caption={t('workflowFigureCaption')} />
          <SectionFigure src="/images/projects/warehouse_product_catalog.jpg" alt={t('catalogFigureAlt')} caption={t('catalogFigureCaption')} />
        </div>
      </Section>

      <Section title={t('statusTitle')}>
        <Body>{t('statusText')}</Body>
        {demoUrl && (
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            {t('demoCta')}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        )}
      </Section>
    </ProjectLayout>
  );
}
