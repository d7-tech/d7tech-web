export default function TechTag({ tag, className = '' }: { tag: string; className?: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded bg-surface text-[13px] text-ink-soft whitespace-nowrap ${className}`}>
      {tag}
    </span>
  );
}
