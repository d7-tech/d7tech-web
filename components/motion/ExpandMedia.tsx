'use client';

import { useRef } from 'react';
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Media that opens up as it scrolls into view: it starts inset with the image
 * slightly zoomed, and reaches full width with the image settled by the time
 * it is centred on screen.
 */
export default function ExpandMedia({
  children,
  overlay,
  className = '',
  inset = 7,
}: {
  children: React.ReactNode;
  /** drawn inside the opening frame but not zoomed (e.g. a caption) */
  overlay?: React.ReactNode;
  className?: string;
  /** starting side inset, % of width */
  inset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const side = useTransform(scrollYProgress, [0, 1], [inset, 0]);
  const clipPath = useMotionTemplate`inset(0 ${side}% round 4px)`;
  const scale = useTransform(scrollYProgress, [0, 1], [1.14, 1]);

  if (reduce) {
    return (
      <div ref={ref} className={`relative overflow-hidden rounded ${className}`}>
        <div className="absolute inset-0">{children}</div>
        {overlay}
      </div>
    );
  }
  return (
    <motion.div ref={ref} style={{ clipPath }} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ scale }} className="absolute inset-0">
        {children}
      </motion.div>
      {overlay}
    </motion.div>
  );
}
