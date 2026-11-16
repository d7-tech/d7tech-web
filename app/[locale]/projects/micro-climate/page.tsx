import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import WeatherDashboard from '@/components/weather/WeatherDashboard';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'MicroClimatePage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/micro-climate'),
  };
}

export default async function MicroClimatePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'MicroClimatePage' });
  const project = getProjectBySlug('micro-climate')!;

  return (
    <ProjectLayout project={project} locale={params.locale} title={t('title')} subtitle={t('subtitle')} lead={t('overviewText')} showCover={false}>
      <WeatherDashboard />

      <Section title={t('methodsTitle')}>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 max-w-3xl">
          {(['single', 'hybrid', 'online', 'training'] as const).map((k) => (
            <div key={k}>
              <dt className="font-semibold text-ink">{t(`models.${k}.name`)}</dt>
              <dd className="mt-1 text-ink-soft">{t(`models.${k}.text`)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title={t('stationTitle')}>
        <dl className="max-w-2xl border-t border-line text-[15px]">
          {(['board', 'wind', 'rain', 'air', 'link', 'server'] as const).map((k) => (
            <div key={k} className="grid grid-cols-[120px_1fr] gap-4 py-3 border-b border-line">
              <dt className="text-ink-muted">{t(`station.${k}.label`)}</dt>
              <dd className="text-ink">{t(`station.${k}.value`)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title={t('issuesTitle')}>
        <Body>{t('issuesText')}</Body>
      </Section>
    </ProjectLayout>
  );
}
