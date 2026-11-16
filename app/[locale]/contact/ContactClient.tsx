'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader as Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

  const label = 'block text-sm font-medium text-ink mb-1.5';
  const field =
    'w-full px-3 py-2.5 bg-white border border-line rounded-md text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors';
  const err = 'mt-1 text-sm text-red-700';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20">
      <h1 id="contact-heading">{t('heroTitle')}</h1>
      <p className="mt-4 text-lg text-ink-soft max-w-xl">{t('heroDescription')}</p>

      <div className="mt-12 border-t border-line pt-12 grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-8">
          <div>
            <h2 className="text-base font-semibold">{t('locationLabel')}</h2>
            <p className="mt-1">{t('locationValue')}</p>
          </div>
          <div>
            <h2 className="text-base font-semibold">{t('followUs')}</h2>
            <ul className="mt-1 space-y-1">
              {social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
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
            <div className="rounded-md border border-line bg-white p-8" role="status">
              <h2 className="text-xl">{t('successTitle')}</h2>
              <p className="mt-2">{t('successDescription')}</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-brand hover:underline">
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
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-brand text-white text-[15px] font-medium hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
