import Image from 'next/image';

export default function SectionFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="m-0">
      <div className="relative w-full aspect-video rounded-md bg-white border border-line overflow-hidden">
        <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 768px" />
      </div>
      <figcaption className="mt-2.5 text-sm text-ink-muted">{caption}</figcaption>
    </figure>
  );
}
