'use client';

import { useMemo } from 'react';
import { Shape } from 'three';

/*
 * Simplified 3D model of the test model ship, in its own colours only:
 * yellow hull, white deck and cabin, black camera housing, mast and details.
 * Length 1 along +x (bow at +x), up +y, waterline at y = 0.
 */

const YELLOW = '#f0c22e';
const WHITE = '#f2f4f5';
const BLACK = '#121417';

function hullShape(halfBeam: number, bowStart: number) {
  // top-down outline in (x, y); extruded upwards later
  const s = new Shape();
  s.moveTo(-0.5, -halfBeam);
  s.lineTo(bowStart, -halfBeam);
  s.quadraticCurveTo(0.42, -halfBeam * 0.85, 0.5, 0);
  s.quadraticCurveTo(0.42, halfBeam * 0.85, bowStart, halfBeam);
  s.lineTo(-0.5, halfBeam);
  s.closePath();
  return s;
}

export default function ShipModel() {
  const lower = useMemo(() => hullShape(0.115, 0.12), []);
  const upper = useMemo(() => hullShape(0.108, 0.1), []);

  return (
    <group>
      {/* yellow hull, from just below the waterline up to the deck */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[lower, { depth: 0.1, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }]} />
        <meshStandardMaterial color={YELLOW} roughness={0.45} metalness={0.05} />
      </mesh>
      {/* white deck */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[upper, { depth: 0.035, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005, bevelSegments: 2 }]} />
        <meshStandardMaterial color={WHITE} roughness={0.4} />
      </mesh>
      {/* black rub strip along the deck edge */}
      <mesh position={[-0.05, 0.05, 0]}>
        <boxGeometry args={[0.86, 0.012, 0.226]} />
        <meshStandardMaterial color={BLACK} roughness={0.6} />
      </mesh>

      {/* white cabin with a black window band */}
      <mesh position={[-0.08, 0.13, 0]}>
        <boxGeometry args={[0.36, 0.08, 0.17]} />
        <meshStandardMaterial color={WHITE} roughness={0.35} />
      </mesh>
      <mesh position={[0.01, 0.14, 0]}>
        <boxGeometry args={[0.2, 0.032, 0.174]} />
        <meshStandardMaterial color={BLACK} roughness={0.15} metalness={0.4} />
      </mesh>

      {/* black camera housing and dome on top */}
      <mesh position={[0.02, 0.2, 0]}>
        <boxGeometry args={[0.09, 0.06, 0.09]} />
        <meshStandardMaterial color={BLACK} roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0.02, 0.235, 0]}>
        <sphereGeometry args={[0.038, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0a0b0d" roughness={0.1} metalness={0.6} />
      </mesh>

      {/* black mast */}
      <mesh position={[-0.2, 0.25, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.18, 8]} />
        <meshStandardMaterial color={BLACK} />
      </mesh>

      {/* black stern unit */}
      <mesh position={[-0.47, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.12]} />
        <meshStandardMaterial color={BLACK} roughness={0.5} />
      </mesh>
    </group>
  );
}
