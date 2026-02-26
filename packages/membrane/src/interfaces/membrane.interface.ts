import { PlainLiteralObject } from '../membrane.types';

/**
 * Interface for any membrane.
 * Stateless — ambient flows through diffuse() at call time.
 */
export interface IMembrane<
  TBase,
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> {
  /**
   * When `'passthrough'`, Permeator returns original base instead of the output membrane result.
   */
  readonly strategy?: string;
  diffuse(base: TBase, ambient?: TAmbient): Promise<TBase & TPermeate>;
}
