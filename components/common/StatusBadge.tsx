import { useTranslations } from 'next-intl';

type Status = 'active' | 'completed' | 'in-development';

const labelKey: Record<Status, 'active' | 'completed' | 'inDevelopment'> = {
  active: 'active',
  completed: 'completed',
  'in-development': 'inDevelopment',
};

const dot: Record<Status, string> = {
  active: 'bg-emerald-600',
  completed: 'bg-ink-muted',
  'in-development': 'bg-amber-500',
};

export default function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  const t = useTranslations('StatusBadge');
  return (
    <p className={`flex items-center gap-2 text-[13px] text-ink-muted ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} aria-hidden="true" />
      {t(labelKey[status])}
    </p>
  );
}
