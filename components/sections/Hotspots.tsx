'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ExpandMedia from '@/components/motion/ExpandMedia';

export type Spot = {
  id: string;
  /** position of the feature, % of the image width / visible height */
  x: number;
  y: number;
  /** which side of the point the label sits on */
  side: 'left' | 'right';
  label: string;
  text: string;
};

/**
 * An image with labelled points. Each label opens a short explanation.
 * The image keeps one aspect ratio at every width so the points stay on their features.
 */
export default function Hotspots({
  src,
  alt,
  spots,
  caption,
  openLabel,
  closeLabel,
}: {
  src: string;
  alt: string;
  spots: Spot[];
  caption: string;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const icon = (isOpen: boolean) => (
    <span
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-[#d5dde4] bg-white shrink-0"
      aria-hidden="true"
    >
      <span className={`absolute w-3.5 h-[1.5px] bg-signal transition-transform duration-300 ${isOpen ? 'rotate-45' : '-translate-y-[3px]'}`} />
      <span className={`absolute w-3.5 h-[1.5px] bg-signal transition-transform duration-300 ${isOpen ? '-rotate-45' : 'translate-y-[3px]'}`} />
    </span>
  );

  const overlay = (
    <div className="absolute inset-0">
      {spots.map((s, i) => {
        const isOpen = open === s.id;
        return (
          <motion.div
            key={s.id}
            className={`absolute ${isOpen ? 'z-20' : 'z-10'}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: 0.5 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* the exact point */}
            <span className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white ring-[5px] ring-white/25" aria-hidden="true" />

            {/* phones: a numbered dot only */}
            <span className="sm:hidden absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] font-mono text-[11px] text-white bg-[#0f151c]/80 rounded px-1">{i + 1}</span>

            {/* larger screens: the pill */}
            <div
              className="hidden sm:block absolute top-0"
              style={{ transform: s.side === 'right' ? 'translate(14px, -50%)' : 'translate(calc(-100% - 14px), -50%)' }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : s.id)}
                aria-expanded={isOpen}
                aria-label={`${s.label}: ${isOpen ? closeLabel : openLabel}`}
                className={`flex items-center gap-3 rounded-full bg-white py-1 shadow-[0_6px_24px_rgba(15,21,28,0.25)] text-[#141c24] text-[15px] tracking-tight whitespace-nowrap hover:shadow-[0_8px_28px_rgba(15,21,28,0.35)] transition-shadow ${
                  s.side === 'right' ? 'flex-row pl-1 pr-5' : 'flex-row-reverse pr-1 pl-5'
                }`}
              >
                {icon(isOpen)}
                {s.label}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className={`absolute mt-2 w-64 rounded bg-white p-4 text-sm leading-relaxed text-[#3e4954] shadow-[0_10px_30px_rgba(15,21,28,0.3)] ${
                      s.side === 'right' ? 'left-0' : 'right-0'
                    }`}
                  >
                    {s.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <figure className="m-0">
      <ExpandMedia className="aspect-[2.6/1] bg-night" overlay={overlay} inset={5}>
        <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 1360px) 100vw, 1360px" />
      </ExpandMedia>
      <figcaption className="mt-4 label">{caption}</figcaption>
      <ol className="sm:hidden mt-4 space-y-3">
        {spots.map((s, i) => (
          <li key={s.id} className="flex gap-3">
            <span className="font-mono text-[11px] text-ink-muted pt-1">{i + 1}</span>
            <span>
              <span className="block text-ink">{s.label}</span>
              <span className="block text-sm text-ink-muted">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
