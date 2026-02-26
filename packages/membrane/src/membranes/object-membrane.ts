import {
  PlainLiteralObject,
  PermeateCallback,
  ObjectMergeStrategy,
  IMembrane,
} from '../membrane.types';

/**
 * Additive membrane: enriches base with permeate data.
 * `preserve` = base wins, `overwrite` = callback result used directly.
 */
export class ObjectMembrane<
  TBase extends object,
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient> {
  constructor(
    private readonly callback: PermeateCallback<TPermeate, TAmbient>,
    public readonly strategy: ObjectMergeStrategy = 'preserve',
  ) {}

  nullish(value: TBase | null | undefined): TBase {
    if (value !== null && value !== undefined) return value;
    return Object.create(null);
  }

  async diffuse(
    base: TBase | null | undefined,
    ambient?: TAmbient,
  ): Promise<TBase & TPermeate> {
    const resolved = this.nullish(base);
    const permeate = await this.callback(resolved, ambient);

    if (this.strategy === 'preserve') {
      return Object.assign(
        Object.create(Object.getPrototypeOf(resolved)),
        permeate,
        resolved,
      );
    }

    return permeate;
  }
}
