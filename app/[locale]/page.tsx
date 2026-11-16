import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import Hero from '@/components/sections/Hero';
import ExpertiseGrid from '@/components/sections/ExpertiseGrid';
import FeaturedProjects from '@/components/sections/FeaturedProjects';
import Credentials from '@/components/sections/Credentials';
import ContactCta from '@/components/sections/ContactCta';
import FeatureCard from '@/components/sections/FeatureCard';
import Fusion from '@/components/sections/Fusion';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'HomePage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: {
      title: t('metadata.title'),
      description: t('metadata.description'),
      type: 'website',
    },
    alternates: getAlternates('/'),
  };
}

export default function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return (
    <>
      <Hero />
      <Credentials />
      <FeatureCard />
      <FeaturedProjects />
      <Fusion />
      <ExpertiseGrid />
      <ContactCta />
    </>
  );
}
