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
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === '/';
  // Over the home hero photo the bar is transparent with light text.
  const overHero = isHome && !scrolled && !open;

  const links = [
    { label: t('projects'), href: '/projects' },
    { label: t('about'), href: '/about' },
    { label: t('contact'), href: '/contact' },
  ];

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);
  const mono = 'font-mono text-[12px] uppercase tracking-[0.06em]';

  const langSwitch = (
    <div className={`flex items-center gap-2 ${mono}`}>
      {(['en', 'tr'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span className="text-ink-muted/60" aria-hidden="true">/</span>}
          <Link
            href={pathname}
            locale={l}
            className={locale === l ? 'text-ink' : 'text-ink-muted hover:text-ink'}
            aria-label={l === 'tr' ? 'Türkçe' : 'English'}
            aria-current={locale === l ? 'true' : undefined}
          >
            {l}
          </Link>
        </span>
      ))}
    </div>
  );

  return (
    <header
      className={`${isHome ? 'fixed' : 'sticky'} top-0 inset-x-0 z-50 border-b transition-colors duration-300 ${
        overHero ? 'on-dark !bg-transparent border-white/15' : 'bg-paper/90 backdrop-blur-md border-line'
      }`}
    >
      <nav className="flex items-stretch justify-between h-14 pl-4 sm:pl-6 lg:pl-8" aria-label={t('mainNavAriaLabel')}>
        <Link
          href="/"
          className={`flex items-center gap-2.5 lg:w-[280px] lg:border-r pr-6 ${overHero ? 'border-white/15' : 'border-line'}`}
          aria-label={t('logoAriaLabel')}
        >
          <Image src="/images/d7-logo.png" alt="" width={26} height={26} priority />
          <span className="text-[17px] font-medium tracking-tight text-ink">D7 Technology</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 pr-4 sm:pr-6 lg:pr-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${mono} transition-colors ${isActive(link.href) ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <span className={`w-px h-4 ${overHero ? 'bg-white/25' : 'bg-line'}`} aria-hidden="true" />
          {langSwitch}
        </div>

        <button
          className="md:hidden px-4 text-ink"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t('closeMenu') : t('openMenu')}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-line bg-paper" data-lenis-prevent>
          <div className="px-4 py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-4 text-xl border-b border-line ${isActive(link.href) ? 'text-ink' : 'text-ink-soft'}`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            <div className="py-5">{langSwitch}</div>
          </div>
        </div>
      )}
    </header>
  );
}
