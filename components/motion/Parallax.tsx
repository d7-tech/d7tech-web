'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/** Moves its content down more slowly than the page while the section scrolls away. */
export default function Parallax({
  children,
  className = '',
  distance = 22,
}: {
  children: React.ReactNode;
  className?: string;
  /** travel in % of the element's height */
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${distance}%`]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1.12]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={reduce ? undefined : { y, scale }} className="absolute inset-0">
        {children}
      </motion.div>
    </div>
  );
}
