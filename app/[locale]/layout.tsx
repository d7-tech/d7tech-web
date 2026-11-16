import '../globals.css';
import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { routing } from '@/i18n/routing';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://d7tech.net'),
  title: {
    default: 'D7 Technology — Autonomous Systems & Advanced Sensing',
    template: '%s | D7 Technology',
  },
  description:
    'D7 Technology designs intelligent autonomous platforms and advanced sensing technologies for real-world applications.',
  keywords: [
    'autonomous vehicles',
    'sensor fusion',
    'radar systems',
    'sonar',
    'AI machine learning',
    'wearable sensors',
    'deep tech',
    'D7 Technology',
  ],
  authors: [{ name: 'D7 Technology', url: 'https://d7tech.net' }],
  creator: 'D7 Technology',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, tCommon] = await Promise.all([
    getMessages(),
    getTranslations({ locale, namespace: 'Common' }),
  ]);

  return (
    <html lang={locale} className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased bg-paper text-ink-soft">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded focus:text-sm focus:font-medium"
          >
            {tCommon('skipToMainContent')}
          </a>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
