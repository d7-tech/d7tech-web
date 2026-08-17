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
      <div className="relative w-full aspect-video rounded-sm bg-[#0a0f1e] border border-[#1a2540] overflow-hidden">
        <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 896px) 100vw, 896px" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#020409]/50 via-transparent to-transparent" aria-hidden="true" />
      </div>
      <figcaption className="mt-3 text-xs text-slate-600 text-center sm:text-left">{caption}</figcaption>
    </figure>
  );
}
