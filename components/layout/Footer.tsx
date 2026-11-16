import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('Footer');

  const companyLinks = [
    { labelKey: 'links.about' as const, href: '/about' },
    { labelKey: 'links.projects' as const, href: '/projects' },
    { labelKey: 'links.contact' as const, href: '/contact' },
  ];

  const projectLinks = [
    { labelKey: 'projectLinks.advisorAsv' as const, href: '/projects/advisor' },
    { labelKey: 'projectLinks.microClimate' as const, href: '/projects/micro-climate' },
    { labelKey: 'projectLinks.multiStaticRadar' as const, href: '/projects/multistatic' },
    { labelKey: 'projectLinks.wearableSensors' as const, href: '/projects/wearable-sensors' },
    { labelKey: 'projectLinks.underwaterGliders' as const, href: '/projects/underwater-gliders' },
    { labelKey: 'projectLinks.warehouseAutomation' as const, href: '/projects/warehouse-automation' },
  ];

  const socialLinks = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/d7-technology/' },
    { label: 'YouTube', href: 'https://www.youtube.com/@stegtu3983' },
  ];

  const linkClass = 'text-sm text-ink-soft hover:text-ink hover:underline';
  const headClass = 'text-sm font-semibold text-ink mb-3';

  return (
    <footer className="border-t border-line bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
              <Image src="/images/d7-logo.png" alt="" width={28} height={28} />
              <span className="font-semibold text-ink">D7 Technology</span>
            </Link>
            <p className="text-sm text-ink-muted max-w-xs">{t('tagline')}</p>
          </div>

          <div>
            <h4 className={headClass}>{t('company')}</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>{t(link.labelKey)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={headClass}>{t('projects')}</h4>
            <ul className="space-y-2">
              {projectLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>{t(link.labelKey)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={headClass}>{t('connect')}</h4>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-muted">Istanbul, Türkiye</p>
          </div>
        </div>

        <p className="mt-12 pt-6 border-t border-line text-xs text-ink-muted">
          &copy; {new Date().getFullYear()} {t('rights')}
        </p>
      </div>
    </footer>
  );
}
