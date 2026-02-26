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
   * Resolves a nullish value to a type-appropriate empty base.
   * Called internally by `diffuse()` so every membrane handles
   * `null | undefined` transparently.
   */
  nullish(value: TBase | null | undefined): TBase;

  diffuse(
    base: TBase | null | undefined,
    ambient?: TAmbient,
  ): Promise<TBase & TPermeate>;
}
