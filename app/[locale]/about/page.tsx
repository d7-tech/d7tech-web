import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAlternates } from '@/lib/metadata';
import Reveal from '@/components/motion/Reveal';

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
  /** omitted when we have no profile link */
  linkedin?: string;
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'AboutPage' });

  const team: TeamMember[] = [
    { name: t('team.ahmet.name'), role: t('team.ahmet.role'), linkedin: 'https://www.linkedin.com/in/ahmet-g%C3%BCne%C5%9F-phd-mba/' },
    { name: t('team.bilal.name'), role: t('team.bilal.role'), linkedin: 'https://www.linkedin.com/in/bilal-bayram-6175a5307/' },
    { name: t('team.fehim.name'), role: t('team.fehim.role'), linkedin: 'https://www.linkedin.com/in/fehim-ku%C5%9F-a19006131/' },
    { name: t('team.zain.name'), role: t('team.zain.role') },
    { name: t('team.zeynep.name'), role: t('team.zeynep.role') },
    { name: t('team.ceyda.name'), role: t('team.ceyda.role') },
  ];

  const timeline = [
    { year: t('timeline.year2025Label'), events: [t('timeline.year2025e1'), t('timeline.year2025e2')] },
    { year: t('timeline.yearJan2026Label'), events: [t('timeline.yearJan2026e1')] },
    { year: t('timeline.year2026Label'), events: [t('timeline.year2026e1'), t('timeline.year2026e2')] },
  ];

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section className="border-t border-line py-10 sm:py-14 grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-16" aria-labelledby={id}>
      <h2 id={id} className="text-2xl sm:text-[1.75rem]">{title}</h2>
      <div>{children}</div>
    </section>
  );

  return (
    <div className="wrap pt-16 sm:pt-24 pb-16">
      <header className="pb-14 sm:pb-16">
        <Reveal>
<h1 id="about-heading">{t('heroTitle')}</h1>
        <p className="mt-4 text-xl text-ink-muted max-w-2xl">{t('heroDescription')}</p>
      </Reveal>
      </header>

      <Section id="mission-heading" title={t('missionTitle')}>
        <p className="text-lg max-w-2xl">{t('missionText')}</p>
      </Section>

      <Section id="team-heading" title={t('teamTitle')}>
        <ul className="grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <li key={member.name} className="bg-paper p-5">
              {member.linkedin ? (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink hover:text-brand-light"
                >
                  {member.name}
                </a>
              ) : (
                <p className="font-medium text-ink">{member.name}</p>
              )}
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">{member.role}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="history-heading" title={t('historyTitle')}>
        <dl className="space-y-6">
          {timeline.map((item) => (
            <div key={item.year} className="grid grid-cols-[96px_1fr] gap-4 border-b border-line pb-5 last:border-0">
              <dt className="font-mono text-sm text-brand-light tabular-nums pt-0.5">{item.year}</dt>
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
