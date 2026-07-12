/** A CFOP formula entry */
export interface Formula {
  id: string;
  category: 'cross' | 'f2l' | 'oll' | 'pll';
  name: string;
  /** The algorithm that *solves* this case (applied after the pattern appears) */
  algorithm: string;
  /** Inverse algorithm: applied to a solved cube to generate the pattern */
  inverse: string;
  /** Optional description or recognition notes */
  description: string;
}
