import { useTranslations } from 'next-intl';

type Status = 'active' | 'completed' | 'in-development';

const labelKey: Record<Status, 'active' | 'completed' | 'inDevelopment'> = {
  active: 'active',
  completed: 'completed',
  'in-development': 'inDevelopment',
};

const dot: Record<Status, string> = {
  active: 'bg-emerald-500',
  completed: 'bg-slate-400',
  'in-development': 'bg-amber-500',
};

export default function StatusBadge({
  status,
  className = '',
  tone = 'light',
}: {
  status: Status;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const t = useTranslations('StatusBadge');
  return (
    <p className={`flex items-center gap-2 text-[13px] ${tone === 'dark' ? 'text-night-soft' : 'text-ink-muted'} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} aria-hidden="true" />
      {t(labelKey[status])}
    </p>
  );
}
