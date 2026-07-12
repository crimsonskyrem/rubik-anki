import type { Formula } from './types';

/**
 * Generate the cube pattern (face state) for a given formula.
 * Returns a string describing which faces are affected.
 */
export function generatePattern(formula: Formula): string {
  // The pattern is simply the cube state after applying the inverse algorithm
  // to a solved cube — this shows what the cube looks like BEFORE you apply
  // the solving algorithm.
  return `Pattern for ${formula.name}:\n` +
    `Apply inverse algorithm to solved cube: ${formula.inverse}\n` +
    `Then solve with: ${formula.algorithm}`;
}
