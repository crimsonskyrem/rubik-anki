/** A CFOP formula entry */
export interface Formula {
  id: string;
  category: 'cross' | 'f2l' | 'oll' | 'pll';
  name: string;
  /** The primary algorithm that *solves* this case (applied after the pattern appears) */
  algorithm: string;
  /** Additional valid algorithms for the same case (empty if none). Each is a verified alternative. */
  alternatives: string[];
  /** Inverse algorithm: applied to a solved cube to generate the pattern (inverse of the primary) */
  inverse: string;
  /** Optional description or recognition notes */
  description: string;
}
