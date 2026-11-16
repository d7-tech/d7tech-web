'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { label: t('projects'), href: '/projects' },
    { label: t('about'), href: '/about' },
    { label: t('contact'), href: '/contact' },
  ];

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  const langSwitch = (
    <div className="flex items-center gap-2 text-sm">
      {(['en', 'tr'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span className="text-line" aria-hidden="true">/</span>}
          <Link
            href={pathname}
            locale={l}
            className={locale === l ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'}
            aria-label={l === 'tr' ? 'Türkçe' : 'English'}
            aria-current={locale === l ? 'true' : undefined}
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-line">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" aria-label={t('mainNavAriaLabel')}>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3" aria-label={t('logoAriaLabel')}>
            <Image src="/images/d7-logo.png" alt="" width={34} height={34} priority />
            <span className="text-[17px] font-semibold text-ink tracking-tight">D7 Technology</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] transition-colors ${
                  isActive(link.href)
                    ? 'text-brand font-medium'
                    : 'text-ink-soft hover:text-ink'
                }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            <span className="w-px h-4 bg-line" aria-hidden="true" />
            {langSwitch}
          </div>

          <button
            className="md:hidden -mr-2 p-2 text-ink-soft hover:text-ink"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('closeMenu') : t('openMenu')}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-line bg-paper">
          <div className="px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-3 text-base border-b border-line last:border-0 ${
                  isActive(link.href) ? 'text-brand font-medium' : 'text-ink'
                }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 pb-2">{langSwitch}</div>
          </div>
        </div>
      )}
    </header>
  );
}
