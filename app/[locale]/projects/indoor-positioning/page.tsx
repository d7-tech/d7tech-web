import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import LoopVideo from '@/components/media/LoopVideo';
import SensingLayers from '@/components/anim/SensingLayers';
import { getProjectBySlug } from '@/lib/data/projects';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'IndoorPositioningPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'article' },
    alternates: getAlternates('/projects/indoor-positioning'),
  };
}

export default async function IndoorPositioningPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'IndoorPositioningPage' });
  const project = getProjectBySlug('indoor-positioning')!;

  return (
    <ProjectLayout project={project} locale={params.locale} title={t('title')} subtitle={t('subtitle')} lead={t('overviewText')}>
      <Section title={t('videoTitle')}>
        <video
          className="w-full aspect-video bg-night rounded"
          src={project.video}
          poster={project.videoPoster}
          controls
          playsInline
          preload="none"
          aria-label={t('title')}
        />
      </Section>

      <Section title={t('layersTitle')}>
        <SensingLayers
          items={(['uwb', 'optical', 'inertial'] as const).map((k) => ({ name: t(`layers.${k}.name`), text: t(`layers.${k}.text`) }))}
        />
      </Section>

      <Section title={t('twinTitle')}>
        <Body>{t('twinText')}</Body>
        <figure className="m-0">
          <LoopVideo
            src="/videos/digital-twin.mp4"
            poster="/images/projects/digital-twin.jpg"
            className="w-full aspect-[2.1/1] object-cover bg-night rounded"
            label={t('twinCaption')}
          />
          <figcaption className="mt-2.5 text-sm text-ink-muted">{t('twinCaption')}</figcaption>
        </figure>
      </Section>
    </ProjectLayout>
  );
}
