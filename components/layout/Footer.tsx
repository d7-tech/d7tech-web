import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('Footer');

  const companyLinks = [
    { labelKey: 'links.projects' as const, href: '/projects' },
    { labelKey: 'links.about' as const, href: '/about' },
    { labelKey: 'links.contact' as const, href: '/contact' },
  ];

  const socialLinks = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/d7-technology/' },
    { label: 'YouTube', href: 'https://www.youtube.com/@stegtu3983' },
  ];

  const linkClass = 'font-mono text-[12px] uppercase tracking-[0.06em] text-ink-muted hover:text-ink';

  return (
    <footer className="on-dark deeper">
      <div className="wrap py-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/images/d7-logo.png" alt="" width={28} height={28} />
            <span className="font-medium text-ink">D7 Technology</span>
          </Link>
          <p className="mt-3 text-sm text-ink-muted">{t('tagline')}</p>
        </div>

        <div className="flex gap-12 sm:gap-16">
          <ul className="space-y-2">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>{t(link.labelKey)}</Link>
              </li>
            ))}
          </ul>
          <ul className="space-y-2">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="wrap pb-8">
        <p className="pt-6 border-t border-line label">
          &copy; {new Date().getFullYear()} {t('rights')}
        </p>
      </div>
    </footer>
  );
}
