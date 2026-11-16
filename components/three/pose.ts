/**
 * Pose of a 3D object drawn by Overlay3D, in CSS pixels of the overlay (x right, y down) and radians.
 * Rotations nest: outer (x then z, screen space) > mid (y, yaw) > inner (x roll, z pitch, object space).
 * Kept in its own file so pages can hold a pose without loading three.js.
 */
export type Pose3D = {
  visible: boolean;
  x: number;
  y: number;
  /** object length in px */
  s: number;
  ox: number;
  oz: number;
  my: number;
  ix: number;
  iz: number;
};

export const emptyPose = (): Pose3D => ({ visible: false, x: 0, y: 0, s: 1, ox: 0, oz: 0, my: 0, ix: 0, iz: 0 });
