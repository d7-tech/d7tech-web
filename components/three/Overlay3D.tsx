'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import GliderModel from './GliderModel';
import ShipModel from './ShipModel';
import type { Pose3D } from './pose';

export type { Pose3D } from './pose';

function Driver({
  pose,
  onInvalidate,
  children,
}: {
  pose: MutableRefObject<Pose3D>;
  onInvalidate: (fn: () => void) => void;
  children: React.ReactNode;
}) {
  const outer = useRef<Group>(null);
  const mid = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const { size, invalidate } = useThree();

  useEffect(() => onInvalidate(invalidate), [invalidate, onInvalidate]);

  useFrame(() => {
    const p = pose.current;
    if (!outer.current || !mid.current || !inner.current) return;
    outer.current.visible = p.visible;
    outer.current.position.set(p.x - size.width / 2, size.height / 2 - p.y, 0);
    outer.current.scale.setScalar(p.s);
    outer.current.rotation.set(p.ox, 0, p.oz, 'XZY');
    mid.current.rotation.set(0, p.my, 0);
    inner.current.rotation.set(p.ix, 0, p.iz, 'XZY');
  });

  return (
    <group ref={outer}>
      <group ref={mid}>
        <group ref={inner}>{children}</group>
      </group>
    </group>
  );
}

/** Transparent canvas laid over a section; draws one model at the pose it is given. */
export default function Overlay3D({
  model,
  pose,
  onInvalidate,
  className = '',
}: {
  model: 'glider' | 'ship';
  pose: MutableRefObject<Pose3D>;
  onInvalidate: (fn: () => void) => void;
  className?: string;
}) {
  return (
    <Canvas
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      orthographic
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 2000], zoom: 1, near: 1, far: 6000 }}
    >
      <hemisphereLight args={['#ffffff', '#3a4a5a', 1.1]} />
      <directionalLight position={[-600, 900, 1200]} intensity={2.4} />
      <directionalLight position={[700, -300, 600]} intensity={0.7} />
      <Driver pose={pose} onInvalidate={onInvalidate}>
        {model === 'glider' ? <GliderModel /> : <ShipModel />}
      </Driver>
    </Canvas>
  );
}
