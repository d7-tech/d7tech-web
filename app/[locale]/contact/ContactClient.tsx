'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader as Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Reveal from '@/components/motion/Reveal';

// Base schema for TypeScript type inference
const baseSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.enum(['general', 'collaboration', 'careers', 'press']),
  message: z.string().min(20),
});

type FormData = z.infer<typeof baseSchema>;

export default function ContactClient() {
  const t = useTranslations('ContactPage');
  const [submitted, setSubmitted] = useState(false);

  // Schema with translated validation messages
  const schema = z.object({
    name: z.string().min(2, t('validationNameMin')),
    email: z.string().email(t('validationEmailInvalid')),
    subject: z.enum(['general', 'collaboration', 'careers', 'press'], {
      required_error: t('validationSubjectRequired'),
    }),
    message: z.string().min(20, t('validationMessageMin')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send');
    setSubmitted(true);
    reset();
  };

  const social = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/d7-technology/' },
    { label: 'YouTube', href: 'https://www.youtube.com/@stegtu3983' },
  ];

  const subjectOptions = [
    { value: '', label: t('subjectPlaceholder') },
    { value: 'general', label: t('subjectGeneral') },
    { value: 'collaboration', label: t('subjectCollaboration') },
    { value: 'careers', label: t('subjectCareers') },
    { value: 'press', label: t('subjectPress') },
  ];

  const label = 'block font-mono text-[11px] uppercase tracking-wider text-ink-muted mb-2';
  const field =
    'w-full px-3 py-2.5 bg-white/70 border border-line rounded text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light transition-colors';
  const err = 'mt-1 text-sm text-red-700';

  return (
    <div className="wrap pt-16 sm:pt-24 pb-20">
      <Reveal>
<h1 id="contact-heading">{t('heroTitle')}</h1>
      <p className="mt-4 text-xl text-ink-muted max-w-xl">{t('heroDescription')}</p>
      </Reveal>

      <div className="mt-12 border-t border-line pt-12 grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{t('locationLabel')}</h2>
            <p className="mt-2 text-ink">{t('locationValue')}</p>
          </div>
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{t('followUs')}</h2>
            <ul className="mt-2 space-y-1">
              {social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-brand-light hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[15px] text-ink-muted max-w-sm">{t('responseTimeText')}</p>
        </div>

        <div>
          {submitted ? (
            <div className="border border-line bg-surface p-8" role="status">
              <h2 className="text-xl">{t('successTitle')}</h2>
              <p className="mt-2">{t('successDescription')}</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-brand-light hover:underline">
                {t('sendAnother')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className={label}>{t('nameLabel')}</label>
                  <input
                    id="contact-name"
                    {...register('name')}
                    type="text"
                    placeholder={t('namePlaceholder')}
                    autoComplete="name"
                    className={field}
                    aria-invalid={errors.name ? 'true' : undefined}
                  />
                  {errors.name && <p className={err} role="alert">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className={label}>{t('emailLabel')}</label>
                  <input
                    id="contact-email"
                    {...register('email')}
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    autoComplete="email"
                    className={field}
                    aria-invalid={errors.email ? 'true' : undefined}
                  />
                  {errors.email && <p className={err} role="alert">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className={label}>{t('subjectLabel')}</label>
                <select
                  id="contact-subject"
                  {...register('subject')}
                  defaultValue=""
                  className={`${field} cursor-pointer`}
                  aria-invalid={errors.subject ? 'true' : undefined}
                >
                  {subjectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === ''}>{opt.label}</option>
                  ))}
                </select>
                {errors.subject && <p className={err} role="alert">{errors.subject.message}</p>}
              </div>

              <div>
                <label htmlFor="contact-message" className={label}>{t('messageLabel')}</label>
                <textarea
                  id="contact-message"
                  {...register('message')}
                  rows={6}
                  placeholder={t('messagePlaceholder')}
                  className={`${field} resize-y`}
                  aria-invalid={errors.message ? 'true' : undefined}
                />
                {errors.message && <p className={err} role="alert">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 size={15} className="animate-spin" aria-hidden="true" />{t('sending')}</>
                ) : t('submitButton')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
