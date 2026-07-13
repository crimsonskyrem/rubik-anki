import { Vector3 } from 'three';

/** A single sticker element on the cube */
export interface StickerElement {
  color: string;      // hex color string
  pos: Vector3;       // world-space position in the Cube group
  normal: Vector3;    // world-space normal in the Cube group
}

/** Colors: top, bottom, left, right, front, back */
export type FaceColors = [string, string, string, string, string, string];

/**
 * Generate the 54 sticker elements for a solved 3×3×3 cube.
 * The Cube group is rotated π/4 around X and Y by the caller,
 * so positions/normals are in the Cube's local space.
 *
 * Coordinate system (Cube local space):
 *   +y = up, -y = down
 *   +x = right, -x = left
 *   +z = front, -z = back
 */
export function createStickerElements(
  order: number = 3,
  colors: FaceColors = ['#ffffff', '#ffd500', '#ff5900', '#b90000', '#009b48', '#0045f6'],
): StickerElement[] {
  const elements: StickerElement[] = [];
  const size = 1;
  const border = (order * size) / 2 - 0.5; // 1.0 for order=3
  const faceOffset = border + size * 0.5;   // 1.5 — distance from origin to face center

  // U face (+y) — white
  for (let x = -border; x <= border; x += size) {
    for (let z = -border; z <= border; z += size) {
      elements.push({
        color: colors[0],
        pos: new Vector3(x, faceOffset, z),
        normal: new Vector3(0, 1, 0),
      });
    }
  }

  // D face (-y) — yellow
  for (let x = -border; x <= border; x += size) {
    for (let z = -border; z <= border; z += size) {
      elements.push({
        color: colors[1],
        pos: new Vector3(x, -faceOffset, z),
        normal: new Vector3(0, -1, 0),
      });
    }
  }

  // L face (-x) — orange
  for (let y = -border; y <= border; y += size) {
    for (let z = -border; z <= border; z += size) {
      elements.push({
        color: colors[2],
        pos: new Vector3(-faceOffset, y, z),
        normal: new Vector3(-1, 0, 0),
      });
    }
  }

  // R face (+x) — red
  for (let y = -border; y <= border; y += size) {
    for (let z = -border; z <= border; z += size) {
      elements.push({
        color: colors[3],
        pos: new Vector3(faceOffset, y, z),
        normal: new Vector3(1, 0, 0),
      });
    }
  }

  // F face (+z) — green
  for (let x = -border; x <= border; x += size) {
    for (let y = -border; y <= border; y += size) {
      elements.push({
        color: colors[4],
        pos: new Vector3(x, y, faceOffset),
        normal: new Vector3(0, 0, 1),
      });
    }
  }

  // B face (-z) — blue
  for (let x = -border; x <= border; x += size) {
    for (let y = -border; y <= border; y += size) {
      elements.push({
        color: colors[5],
        pos: new Vector3(x, y, -faceOffset),
        normal: new Vector3(0, 0, -1),
      });
    }
  }

  return elements;
}

/** Deep-clone sticker elements (used for storing initial state) */
export function cloneElements(elements: StickerElement[]): StickerElement[] {
  return elements.map(e => ({
    color: e.color,
    pos: e.pos.clone(),
    normal: e.normal.clone(),
  }));
}

/** Snap to nearest grid position (half-integer: ±1.5, ±0.5, 0; normals → ±1, 0) */
export function roundToGrid(v: Vector3): Vector3 {
  return new Vector3(
    Math.round(v.x * 2) / 2,
    Math.round(v.y * 2) / 2,
    Math.round(v.z * 2) / 2,
  );
}
