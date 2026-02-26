import {
  PlainLiteralObject,
  PermeateCallback,
  ObjectMergeStrategy,
  IMembrane,
} from '../membrane.types';

/**
 * Subtractive membrane: merges base and permeate following
 * strategy, then returns only keys present in permeate.
 * Can subtract base keys and add new ones.
 */
export class ObjectProjectionMembrane<
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

    const merged =
      this.strategy === 'preserve'
        ? Object.assign(
            Object.create(Object.getPrototypeOf(resolved)),
            permeate,
            resolved,
          )
        : { ...resolved, ...permeate };

    const result = Object.create(null);

    for (const key of Object.keys(permeate)) {
      result[key] = merged[key];
    }

    return result;
  }
}
