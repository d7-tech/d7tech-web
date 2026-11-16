'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/** The glider render glides across its panel as the page scrolls, pitching like it changes depth, and bobs gently. */
export default function GliderVisual({ alt }: { alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['-12%', '10%']);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -4]);

  const image = (
    <Image src="/images/projects/underwater-gliders.jpg" alt={alt} fill className="object-contain" sizes="(max-width: 1360px) 100vw, 1280px" />
  );

  return (
    <div ref={ref} className="relative aspect-[16/8] sm:aspect-[16/7] rounded overflow-hidden bg-white">
      <div className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)]">
      {reduce ? (
        <div className="absolute inset-[4%]">{image}</div>
      ) : (
        <motion.div style={{ x, rotate }} className="absolute inset-[4%]">
          <motion.div
            className="absolute inset-0"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {image}
          </motion.div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
