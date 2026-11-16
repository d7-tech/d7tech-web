import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import ProjectLayout, { Section, Body } from '@/components/projects/ProjectLayout';
import Image from 'next/image';
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
      <Section title={t('layersTitle')}>
        <SensingLayers
          items={(['uwb', 'optical', 'inertial'] as const).map((k) => ({ name: t(`layers.${k}.name`), text: t(`layers.${k}.text`) }))}
        />
      </Section>

      <Section title={t('twinTitle')}>
        <Body>{t('twinText')}</Body>
        <figure className="m-0">
          <div className="relative w-full aspect-[2.6/1] rounded overflow-hidden bg-night">
            <Image src="/images/projects/digital-twin-still.jpg" alt={t('twinCaption')} fill className="object-cover object-top" sizes="(max-width: 1360px) 100vw, 900px" />
          </div>
          <figcaption className="mt-3 text-sm text-ink-muted">{t('twinCaption')}</figcaption>
        </figure>
      </Section>
    </ProjectLayout>
  );
}
