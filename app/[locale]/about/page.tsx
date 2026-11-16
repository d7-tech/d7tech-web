import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'AboutPage' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: { title: t('metadata.title'), description: t('metadata.description'), type: 'website' },
    alternates: getAlternates('/about'),
  };
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  linkedin: string;
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'AboutPage' });

  const team: TeamMember[] = [
    { name: t('team.ahmet.name'), role: t('team.ahmet.role'), initials: 'AG', linkedin: 'https://www.linkedin.com/in/ahmet-g%C3%BCne%C5%9F-phd-mba/' },
    { name: t('team.bilal.name'), role: t('team.bilal.role'), initials: 'BB', linkedin: 'https://www.linkedin.com/in/bilal-bayram-6175a5307/' },
    { name: t('team.berkant.name'), role: t('team.berkant.role'), initials: 'BK', linkedin: 'https://www.linkedin.com/in/berkant-kirikkanat-7a1934227/' },
    { name: t('team.fehim.name'), role: t('team.fehim.role'), initials: 'FK', linkedin: 'https://www.linkedin.com/in/fehim-ku%C5%9F-a19006131/' },
    { name: t('team.yigit.name'), role: t('team.yigit.role'), initials: 'YT', linkedin: 'https://www.linkedin.com/in/yigittilaver/' },
    { name: t('team.yusuf.name'), role: t('team.yusuf.role'), initials: 'YE', linkedin: 'https://www.linkedin.com/' }
  ];

  const timeline = [
    { year: t('timeline.year2025Label'), events: [t('timeline.year2025e1'), t('timeline.year2025e2')] },
    { year: t('timeline.yearJan2026Label'), events: [t('timeline.yearJan2026e1')] },
    { year: t('timeline.year2026Label'), events: [t('timeline.year2026e1'), t('timeline.year2026e2')] },
  ];

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section className="border-t border-line py-14 sm:py-20 grid gap-8 lg:grid-cols-[1fr_2fr]" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <div>{children}</div>
    </section>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-12">
      <header className="pb-14 sm:pb-16">
        <h1 id="about-heading">{t('heroTitle')}</h1>
        <p className="mt-4 text-xl text-ink-muted max-w-2xl">{t('heroDescription')}</p>
      </header>

      <Section id="mission-heading" title={t('missionTitle')}>
        <p className="text-lg max-w-2xl">{t('missionText')}</p>
      </Section>

      <Section id="team-heading" title={t('teamTitle')}>
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {team.map((member) => (
            <li key={member.name} className="border-b border-line py-4">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink hover:text-brand hover:underline"
              >
                {member.name}
              </a>
              <p className="text-[15px] text-ink-muted">{member.role}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="history-heading" title={t('historyTitle')}>
        <dl className="space-y-6">
          {timeline.map((item) => (
            <div key={item.year} className="grid grid-cols-[88px_1fr] gap-4">
              <dt className="font-medium text-ink tabular-nums">{item.year}</dt>
              <dd className="space-y-1.5">
                {item.events.map((event) => (
                  <p key={event}>{event}</p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

    </div>
  );
}
