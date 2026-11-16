import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import TrackingField from '@/components/anim/TrackingField';
import SensingLayers from '@/components/anim/SensingLayers';
import Hotspots, { type Spot } from '@/components/sections/Hotspots';

/** Slate section built around the live diagram of the indoor positioning system. */
export default function Fusion() {
  const t = useTranslations('Fusion');
  const tA = useTranslations('Anim');
  const tP = useTranslations('IndoorPositioningPage');
  const labels = { range: tA('range'), raw: tA('raw'), fused: tA('fused'), marker: tA('marker'), camera: tA('camera') };
  const layers = (['uwb', 'optical', 'inertial'] as const).map((k) => ({ name: tP(`layers.${k}.name`) }));
  const tH = useTranslations('Hotspots');
  // Points measured on digital-twin-still.jpg (1600 px wide, top 615 px visible at 2.6:1)
  const spots: Spot[] = [
    { id: 'ship', x: 48.9, y: 14.3, side: 'right', label: tH('items.ship.label'), text: tH('items.ship.text') },
    { id: 'anchors', x: 46.0, y: 31.7, side: 'left', label: tH('items.anchors.label'), text: tH('items.anchors.text') },
    { id: 'markers', x: 64.6, y: 37.7, side: 'right', label: tH('items.markers.label'), text: tH('items.markers.text') },
    { id: 'track', x: 38.4, y: 49.6, side: 'left', label: tH('items.track.label'), text: tH('items.track.text') },
  ];

  return (
    <section className="on-dark py-20 sm:py-28" aria-labelledby="fusion-heading">
      <div className="wrap">
        <Reveal className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="label">{t('label')}</p>
            <h2 id="fusion-heading" className="mt-4">{t('heading')}</h2>
            <p className="mt-4 text-lg max-w-xl">{t('text')}</p>
          </div>
          <Link href="/projects/indoor-positioning" className="btn btn-primary self-start lg:self-auto">
            {t('cta')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </Reveal>

        <div className="mt-12">
          <Hotspots
            src="/images/projects/digital-twin-still.jpg"
            alt={tH('caption')}
            spots={spots}
            caption={tH('caption')}
            openLabel={tH('open')}
            closeLabel={tH('close')}
          />
        </div>

        <Reveal className="mt-16 rounded bg-[#0f151c] p-4 sm:p-8">
          <TrackingField labels={labels} />
        </Reveal>

        <Reveal className="mt-3">
          <SensingLayers items={layers} />
        </Reveal>
      </div>
    </section>
  );
}
