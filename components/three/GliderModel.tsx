'use client';

import { DoubleSide } from 'three';

/*
 * Simplified 3D model of our underwater glider, after the CAD render:
 * transparent hull with battery packs and plates inside, magenta bands,
 * a dark purple nose cap with a glass dome, swept wings and an X tail.
 * Length 1 along +x (nose at +x).
 */

const R = 0.095; // hull radius
const MAGENTA = '#c23fd0';
const PURPLE = '#4c0b3e';
const GREY = '#a7aeb5';
const WING = '#cfd3d7';
const CYAN = '#8fd3da';

// cylinders in three.js run along y; this turns them to run along x
const ALONG_X: [number, number, number] = [0, 0, -Math.PI / 2];

function Tube({ x, len, r, color, ...mat }: { x: number; len: number; r: number; color: string; metalness?: number; roughness?: number }) {
  return (
    <mesh position={[x, 0, 0]} rotation={ALONG_X}>
      <cylinderGeometry args={[r, r, len, 48]} />
      <meshStandardMaterial color={color} metalness={mat.metalness ?? 0.15} roughness={mat.roughness ?? 0.45} />
    </mesh>
  );
}

export default function GliderModel() {
  return (
    <group>
      {/* transparent hull */}
      <mesh rotation={ALONG_X}>
        <cylinderGeometry args={[R, R, 0.86, 64, 1, true]} />
        <meshPhysicalMaterial color="#eef3f6" transparent opacity={0.28} roughness={0.08} metalness={0} side={DoubleSide} depthWrite={false} />
      </mesh>

      {/* inside: plates, rods and battery packs */}
      {[-0.33, -0.21, -0.08, 0.06, 0.2, 0.32].map((x) => (
        <Tube key={x} x={x} len={0.008} r={R * 0.93} color={GREY} />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[0, Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75]} rotation={ALONG_X}>
            <cylinderGeometry args={[0.006, 0.006, 0.7, 8]} />
            <meshStandardMaterial color="#d9dde1" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0.2, side * 0.038, 0]} rotation={ALONG_X}>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 24]} />
          <meshStandardMaterial color={CYAN} metalness={0.2} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.16, 0.05, 0.1]} />
        <meshStandardMaterial color="#4c5a52" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[-0.12, -0.03, 0.03]}>
        <boxGeometry args={[0.06, 0.02, 0.02]} />
        <meshStandardMaterial color="#2fbf6a" metalness={0.2} roughness={0.4} />
      </mesh>

      {/* magenta mid band at the wing root, tail band and fins */}
      <Tube x={-0.02} len={0.17} r={R * 1.12} color={MAGENTA} roughness={0.35} />
      {[-0.07, -0.02, 0.03].map((x) => (
        <Tube key={x} x={x} len={0.012} r={R * 1.15} color="#9b2fa8" />
      ))}
      <Tube x={-0.39} len={0.07} r={R * 1.07} color={MAGENTA} roughness={0.35} />
      <Tube x={-0.44} len={0.03} r={R * 1.0} color={GREY} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <group key={i} position={[-0.4, 0, 0]} rotation={[a, 0, 0]}>
            <mesh position={[0, R + 0.07, 0]}>
              <boxGeometry args={[0.07, 0.14, 0.008]} />
              <meshStandardMaterial color={MAGENTA} roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* wings */}
      <group position={[-0.02, 0, 0]} rotation={[0, 0.12, 0]}>
        <mesh>
          <boxGeometry args={[0.16, 0.007, 1.0]} />
          <meshStandardMaterial color={WING} metalness={0.35} roughness={0.35} />
        </mesh>
        <mesh position={[-0.08, -0.004, 0]}>
          <boxGeometry args={[0.01, 0.008, 1.0]} />
          <meshStandardMaterial color="#3a3f45" />
        </mesh>
      </group>

      {/* nose: dark purple cap ring and glass dome */}
      <Tube x={0.42} len={0.05} r={R * 1.1} color={PURPLE} roughness={0.5} />
      <mesh position={[0.445, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <sphereGeometry args={[R * 0.72, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#c9d1d9" metalness={0.5} roughness={0.08} clearcoat={1} />
      </mesh>
    </group>
  );
}
