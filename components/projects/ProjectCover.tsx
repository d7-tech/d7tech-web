import Image from 'next/image';

type ProjectCoverProps = {
  src: string;
  alt: string;
  /** When true, loads eagerly (e.g. first card above the fold) */
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain';
  /** sizes hint for Next.js image optimization. Defaults to card grid sizes. */
  sizes?: string;
};

export default function ProjectCover({
  src,
  alt,
  priority = false,
  className = '',
  objectFit = 'cover',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: ProjectCoverProps) {
  return (
    <div className={`relative w-full aspect-video rounded-md bg-surface border border-line overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={objectFit === 'contain' ? 'object-contain' : 'object-cover'}
        sizes={sizes}
        quality={90}
        priority={priority}
      />
    </div>
  );
}
