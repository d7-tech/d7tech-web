import { Publication } from '@/lib/data/projects';

export default function PublicationCard({ publication }: { publication: Publication; index?: number }) {
  return (
    <p className="text-[15px] leading-relaxed text-ink-soft">
      {publication.authors}, &ldquo;{publication.title},&rdquo; <em>{publication.conference}</em>{' '}
      <a
        href={`https://doi.org/${publication.doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-sm text-brand-light hover:text-ink break-all"
      >
        doi:{publication.doi}
      </a>
    </p>
  );
}
