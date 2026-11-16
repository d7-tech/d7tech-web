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

  const linkClass = 'text-sm text-night-soft hover:text-white';

  return (
    <footer className="bg-night border-t border-night-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/images/d7-logo.png" alt="" width={28} height={28} />
            <span className="font-semibold text-white">D7 Technology</span>
          </Link>
          <p className="mt-3 text-sm text-night-soft">{t('tagline')}</p>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <p className="pt-6 border-t border-night-line text-xs text-night-soft/70">
          &copy; {new Date().getFullYear()} {t('rights')}
        </p>
      </div>
    </footer>
  );
}
