/** Cube face colors */
export const COLORS = {
  U: 0xffffff, // white
  D: 0xffd500, // yellow
  F: 0x009b48, // green
  B: 0x0045f6, // blue
  R: 0xb90000, // red
  L: 0xff5900, // orange
} as const;

/** Face indices for the 54-sticker array */
export const U = 0;
export const R = 1;
export const F = 2;
export const D = 3;
export const L = 4;
export const B = 5;

export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

/** Axes for each face rotation */
export const FACE_AXIS: Record<string, [number, number, number]> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};
