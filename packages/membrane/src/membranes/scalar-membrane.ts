import { PlainLiteralObject, IMembrane } from '../membrane.types';

/**
 * Primitive membrane for string, number, or boolean values.
 * Callback produces the full replacement value.
 */
export class ScalarMembrane<
  TBase extends string | number | boolean,
  TPermeate extends TBase = TBase,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient> {
  constructor(
    private readonly callback: (
      base: TBase,
      ambient?: TAmbient,
    ) => Promise<TPermeate>,
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
    return await this.callback(resolved, ambient);
  }
}
